"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    pytch_errors,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Error handling.

describe("error handling", () => {
    with_project("py/project/error_in_handler.py", (import_project) => {
        it("collects error from handler", async () => {
            let project = await import_project();
            project.do_synthetic_broadcast("launch-invasion");

            let errs = pytch_errors.drain_errors();
            assert.strictEqual(errs.length, 0);
            project.one_frame();

            errs = pytch_errors.drain_errors();
            assert.strictEqual(errs.length, 1);

            let err_str = errs[0].toString();
            assert.ok(/Alien.*has no attribute.*boost_shields/.test(err_str));
        })});
});
