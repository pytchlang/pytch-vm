"use strict";

const {
    configure_mocha,
    import_deindented,
    js_getattr,
    one_frame,
    assert,
    pytch_errors,
    assertBuildErrorFun,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Machinery to allow more than one loop iteration per frame.

describe("Multiple loop iterations per frame", () => {
});
