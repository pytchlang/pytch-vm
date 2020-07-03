"use strict";


////////////////////////////////////////////////////////////////////////////////

const fs = require("fs");
const reqskulpt = require("../../support/run/require-skulpt").requireSkulpt;

before(() => {
    // Inject 'Sk' object into global namespace.
    reqskulpt(false);

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
});

beforeEach(() => {
    mock_sound_manager.stop_all_performances();
});

afterEach(() => {
    assert.strictEqual(pytch_errors.drain_errors().length, 0,
                       "undrained errors at end of test");
});
