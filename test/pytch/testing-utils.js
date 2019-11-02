"use strict";


////////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const reqskulpt = require('../../support/run/require-skulpt').requireSkulpt;

before(() => {
    // Inject 'Sk' object into global namespace.
    reqskulpt(false);

    // Connect read/write to filesystem and stdout; configure Pytch environment.
    Sk.configure({
        read: (fname => fs.readFileSync(fname, { encoding: "utf8" })),
        output: (args) => { process.stdout.write(args); },
        pytch: {
            async_load_image: (url => Promise.resolve(new MockImage(url))),
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

    global.assert = require("assert");

    global.py_getattr = (py_obj, js_attr_name) =>
        Sk.builtin.getattr(py_obj, Sk.builtin.str(js_attr_name));

    global.js_getattr = (py_obj, js_attr_name) =>
        Sk.ffi.remapToJs(py_getattr(py_obj, js_attr_name));


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Images: Do not actually load anything from the network.  Instead keep a
    // map of URL to width and height, and create a mock image with the right
    // properties.  Some of the images used in tests won't truly exist.

    const image_size_from_url = {
        "library/images/question-mark.png": [32, 32],
        "library/images/marching-alien.png": [60, 20],
        "library/images/firing-alien.png": [80, 30],
    };

    class MockImage {
        constructor(url) {
            let size = image_size_from_url[url];
            this.url = url;
            this.width = size[0];
            this.height = size[1];
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
});
