"use strict";

const {
    configure_mocha,
    with_module,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Auto-registration helpers

describe("auto-registration", () => {
    with_module("py/project/go_live_empty_project.py", (import_module) => {
        it("finds the imported pytch", async () => {
            let module = await import_module();
            let got_pytch = Sk.pytchsupport.pytch_in_module(module);
            assert.ok(got_pytch);
        });
    });

    with_module("py/project/no_import_pytch.py", (import_module) => {
        it("detects lack of \"import pytch\"", async () => {
            let module = await import_module();
            assert.throws(() => Sk.pytchsupport.pytch_in_module(module),
                          /does not do "import pytch"/);
        });
    });
});
