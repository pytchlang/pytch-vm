"use strict";


////////////////////////////////////////////////////////////////////////////////
//
// Error handling.

describe("error handling", () => {
    it("collects error from handler", async () => {
        let project = await import_project("py/project/error_in_handler.py");
        project.do_synthetic_broadcast("launch-invasion");

        let errs = pytch_errors.drain_errors();
        assert.strictEqual(errs.length, 0);
        project.one_frame();

        errs = pytch_errors.drain_errors();
        assert.strictEqual(errs.length, 1);

        let err_str = errs[0].toString();
        assert.ok(/Alien.*has no attribute.*boost_shields/.test(err_str));
    });
});
