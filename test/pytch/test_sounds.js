"use strict";

const {
    configure_mocha,
    with_project,
    with_module,
    one_frame,
    many_frames,
    assert,
    mock_sound_manager,
    import_deindented,
    pytch_errors,
    assertBuildErrorFun,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Sounds

describe("waiting and non-waiting sounds", () => {
    let one_frame_fun = (project => () => {
        mock_sound_manager.one_frame();
        one_frame(project);
    });

    let assert_running_performances = (exp_tags => {
        let got_tags = (mock_sound_manager.running_performances()
                        .map(p => p.tag));
        assert.deepStrictEqual(got_tags, exp_tags);
    });

    with_project("py/project/make_noise.py", (import_project) => {
    it("can play trumpet", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-trumpet");

        // On the next frame, the sound should start, but the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_trumpet"), "no")

        // On the next frame, the sound should still be playing, and the
        // launching thread will have run to completion.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_trumpet"), "yes")
        assert.strictEqual(project.thread_groups.length, 0);

        // For the rest of the length of the 'trumpet' sound, it should stay
        // playing.
        let exp_remaining_trumpet_frames = 20 - 2;
        for (let i = 0; i != exp_remaining_trumpet_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet"]);
        }

        // And then silence should fall again:
        project_one_frame();
        assert_running_performances([]);
    });

    it("can play violin", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-violin");

        // On the next frame, the sound should start, and the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["violin"]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "no")

        // For the rest of the length of the 'violin' sound, it should stay
        // playing, and the thread should remain sleeping.
        let exp_remaining_violin_frames = 10 - 1;
        for (let i = 0; i != exp_remaining_violin_frames; ++i) {
            project_one_frame();
            assert_running_performances(["violin"]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "no")
            assert.strictEqual(project.thread_groups.length, 1);
        }

        // And then silence should fall again as the thread runs to completion.
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "yes")
    });

    it("can stop sounds", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-violin");
        for (let i = 0; i != 4; ++i) {
            project_one_frame();
            assert_running_performances(["violin"]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "no")
        }

        // Everything should immediately go quiet, but the thread won't be woken
        // up until the following frame.
        project.do_synthetic_broadcast("silence");
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "no")

        // The next frame, the calling thread should resume and run to
        // completion.  Nothing further should happen.
        for (let i = 0; i != 10; ++i) {
            project_one_frame();
            assert_running_performances([]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "yes")
            assert.strictEqual(project.thread_groups.length, 0);
        }
    });

    it("can play both", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-both");

        // On the next frame, the trumpet should start, but the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_both"), "no")

        // On the next frame, the violin should start, and the launching
        // thread should be sleeping.
        project_one_frame();
        assert_running_performances(["trumpet", "violin"]);
        assert.strictEqual(orchestra.js_attr("played_both"), "nearly")

        // For the rest of the length of the 'violin' sound, both sounds should
        // stay playing, and the thread should remain sleeping.
        let exp_remaining_violin_frames = 10 - 1;
        for (let i = 0; i != exp_remaining_violin_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet", "violin"]);
            assert.strictEqual(orchestra.js_attr("played_both"), "nearly")
            assert.strictEqual(project.thread_groups.length, 1);
        }

        // For the rest of the length of the 'trumpet' sound, it alone should
        // stay playing, with the thread having run to completion.
        let exp_remaining_trumpet_frames = (20 - 10 - 1);
        for (let i = 0; i != exp_remaining_trumpet_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet"]);
            assert.strictEqual(orchestra.js_attr("played_both"), "yes")
            assert.strictEqual(project.thread_groups.length, 0);
        }

        // And then silence should fall again.
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_both"), "yes")
    })});
});

describe("bad sounds", () => {
    with_module("py/project/bad_sound.py", (import_module) => {
        it("throws Python error if sound file not found", async () => {
            let module = await import_module();
            let caught_exception = module.$d.caught_exception;
            let err_msg = new Sk.builtin.str(caught_exception).v;
            assert.ok(/could not load Sound/.test(err_msg));
            assert.equal(caught_exception.kind, "Sound");
        });
    });

    it("wraps bare error in PytchAssetLoadError", async () => {
        const import_project = import_deindented(`
            import pytch
            class Banana(pytch.Sprite):
                Sounds = ["corrupt-sound-file.mp3"]
        `);
        await assert.rejects(
            import_project,
            assertBuildErrorFun(
                "register-actor",
                Sk.pytchsupport.PytchAssetLoadError,
                /could not decode audio/)
        );
    });

    it("gives useful error message for non-list Sounds", async () => {
        await assert.rejects(
            import_deindented(`
                import pytch
                class Alien(pytch.Sprite):
                    Sounds = ("whoosh.mp3")
            `),
            assertBuildErrorFun("register-actor",
                                Sk.builtin.ValueError,
                                /Sounds must be a list/));
    });

    [
        {
            label: "unknown string",
            fragment: '"violin"',
            error_regexp: /could not find sound/,
        },
        {
            label: "lambda",
            fragment: "lambda x: 42",
            error_regexp: /must be given a string/,
        },
    ].forEach(spec =>
        it(`rejects unknown sound (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch

                class Banana(pytch.Sprite):
                    Costumes = []
                    Sounds = ["trumpet.mp3"]

                    @pytch.when_I_receive("go")
                    def fall_over_0(self):
                        self.fall_over_1()

                    def fall_over_1(self):
                        self.fall_over_2()

                    def fall_over_2(self):
                        self.fall_over_3()

                    def fall_over_3(self):
                        self.start_sound(${spec.fragment})
            `);

            // The error is deferred to the next frame, so we must step
            // two frames to actually see the error.
            project.do_synthetic_broadcast("go");
            many_frames(project, 2);

            // (Can't use pytch_errors.assert_sole_error_matches() because
            // also want to make assertion wrt traceback.)

            const err = pytch_errors.sole_error();
            const err_str = err.err.toString();
            assert.match(err_str, spec.error_regexp);

            // Traceback should have:
            //     Actor.play_sound_until_done()
            //     Banana.fall_over_3()
            //     Banana.fall_over_2()
            //     Banana.fall_over_1()
            //     Banana.fall_over_0()
            assert.equal(err.err.traceback.length, 5);
        }));
});

