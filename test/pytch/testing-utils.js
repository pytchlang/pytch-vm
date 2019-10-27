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
});
