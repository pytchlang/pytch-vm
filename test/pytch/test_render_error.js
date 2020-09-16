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
// Errors raised while rendering.  You have to try moderately hard to cause
// such an error, but we want to handle it gracefully.

describe("rendering error-handler", () => {
    with_project("py/project/render_error.py", (import_project) => {
        it("passes error to callback", async () => {
            const project = await import_project();
            project.on_green_flag_clicked();
            project.one_frame();
            assert.strictEqual(project.rendering_instructions(), null);
            const thrown_errors = pytch_errors.drain_errors();
            assert.equal(thrown_errors.length, 1);
            const error_str = thrown_errors[0].err.toString();
            assert.ok(/'Problem' object has no attribute/.test(error_str));
        });
    });
});
