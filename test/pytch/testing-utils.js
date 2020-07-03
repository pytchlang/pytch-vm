"use strict";


////////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const reqskulpt = require("../../support/run/require-skulpt").requireSkulpt;

before(() => {
    // Inject 'Sk' object into global namespace.
    reqskulpt(false);

    ////////////////////////////////////////////////////////////////////////////////
    //
    // API dependencies for Skulpt


    // Connect read/write to filesystem and stdout; configure Pytch environment.
    Sk.configure({
        read: (fname => fs.readFileSync(fname, { encoding: "utf8" })),
        output: (args) => { process.stdout.write(args); },
        pytch: {
            async_load_image: async_load_mock_image,
            keyboard: mock_keyboard,
            mouse: mock_mouse,
            sound_manager: mock_sound_manager,
            on_exception: pytch_errors.append_error,
        },
    });


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Test helpers

    global.import_local_file = (fname => {
        let code_text = fs.readFileSync(fname, { encoding: "utf8" });
        let do_import = Sk.importMainWithBody("<stdin>", false, code_text, true);
        return Sk.misceval.asyncToPromise(() => do_import);
    });

    global.import_project = (async fname => {
        let import_result = await import_local_file(fname);
        return import_result.$d.project.js_project;
    });

    global.assert = require("assert");

    global.py_getattr = (py_obj, js_attr_name) =>
        Sk.builtin.getattr(py_obj, Sk.builtin.str(js_attr_name));

    global.js_getattr = (py_obj, js_attr_name) =>
        Sk.ffi.remapToJs(py_getattr(py_obj, js_attr_name));

    global.call_method = (py_obj, js_methodname, js_args) => {
        let fun = py_getattr(py_obj, js_methodname);
        let py_args = js_args.map(Sk.ffi.remapToPy);
        let py_result = Sk.misceval.callsimArray(fun, py_args);
        return Sk.ffi.remapToJs(py_result);
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Sounds: Do not actually load anything from the network.  Instead keep a
    // map of URL to duration in frames, and create a mock sound with the right
    // properties.

    const sound_duration_from_url = new Map([
        ["library/sounds/trumpet.mp3", 20],
        ["library/sounds/violin.mp3", 10],
    ]);

    class MockSound {
        constructor(parent_sound_manager, tag, url) {
            this.parent_sound_manager = parent_sound_manager;
            this.tag = tag;
            this.duration = sound_duration_from_url.get(url);
        }

        launch_new_performance() {
            let performance = new MockSoundPerformance(this.tag, this.duration);
            this.parent_sound_manager.register_running_performance(performance);
            return performance;
        }
    }

    class MockSoundPerformance {
        constructor(tag, duration) {
            this.tag = tag;
            this.n_frames_left = duration;
            this.has_ended = false;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Specialised testing predicates.

    global.assert_Appearance_equal = (got_appearance,
                                      exp_img_url, exp_img_wd, exp_img_ht,
                                      exp_centre_x,
                                      exp_centre_y) => {
        assert.equal(got_appearance.image.url, exp_img_url);
        assert.equal(got_appearance.image.width, exp_img_wd);
        assert.equal(got_appearance.image.height, exp_img_ht);
        assert.strictEqual(got_appearance.centre_x, exp_centre_x)
        assert.strictEqual(got_appearance.centre_y, exp_centre_y);
    };

    global.assert_renders_as = (label,
                                project,
                                exp_render_instrns) => {
        let got_render_instrns = project.rendering_instructions();

        let exp_n_instrns = exp_render_instrns.length;
        let got_n_instrns = got_render_instrns.length;
        assert.strictEqual(got_n_instrns, exp_n_instrns,
                           `for ${label}, got ${got_n_instrns} rendering`
                           + ` instruction/s but expected ${exp_n_instrns}`);

        got_render_instrns.forEach((got_instr, idx) => {
            let exp_instr = exp_render_instrns[idx];

            assert.strictEqual(got_instr.kind, exp_instr[0],
                               `at index ${idx} of ${label}, got instruction`
                               + ` of kind "${got_instr.kind}" but expected`
                               + ` kind "${exp_instr[0]}"`);

            switch(got_instr.kind) {
            case "RenderImage":
                let pfx = `in RenderImage at index ${idx} of ${label}`;
                assert.ok(((got_instr.x == exp_instr[1])
                           && (got_instr.y == exp_instr[2])),
                          `${pfx}, got coords (${got_instr.x}, ${got_instr.y})`
                          + ` but expected (${exp_instr[1]}, ${exp_instr[2]})`);
                assert.ok(got_instr.scale == exp_instr[3],
                          `${pfx}, got scale ${got_instr.scale}`
                          + ` but expected ${exp_instr[3]}`);
                assert.ok(got_instr.image_label == exp_instr[4],
                          `${pfx}, got image-label "${got_instr.image_label}"`
                          + ` but expected "${exp_instr[4]}"`);
                break;
            default:
                assert.ok(null,
                          `unknown instruction kind "${got_instr.kind}"`);
            }
        });
    };

    global.assert_has_bbox = (label, actor_instance,
                              exp_xmin, exp_xmax,
                              exp_ymin, exp_ymax) => {
        let got_bbox = actor_instance.bounding_box();

        const assert_prop_eq = ((slot, exp_val) => {
            let got_val = got_bbox[slot];
            let msg = (`got ${got_val} for ${slot} of ${label}`
                       + ` but expected ${exp_val}`);
            assert.equal(got_val, exp_val, msg);
        });

        assert_prop_eq("x_min", exp_xmin);
        assert_prop_eq("x_max", exp_xmax);
        assert_prop_eq("y_min", exp_ymin);
        assert_prop_eq("y_max", exp_ymax);
    };
});

beforeEach(() => {
    mock_sound_manager.stop_all_performances();
});

afterEach(() => {
    assert.strictEqual(pytch_errors.drain_errors().length, 0,
                       "undrained errors at end of test");
});
