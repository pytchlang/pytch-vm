"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    pytch_errors,
    js_getattr,
    many_frames,
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

    with_project("py/project/render_error_others_stop.py", (import_project) => {
        it("halts other threads on render error", async () => {
            const project = await import_project();
            const counter = project.instance_0_by_class_name("Counter").py_object;
            const counter_value = () => js_getattr(counter, "n");

            project.do_synthetic_broadcast("go");
            many_frames(project, 10);
            assert.equal(counter_value(), 10);

            project.do_synthetic_broadcast("trouble");
            project.one_frame();
            assert.strictEqual(project.rendering_instructions(), null);
            const thrown_errors = pytch_errors.drain_errors();
            assert.equal(thrown_errors.length, 1);

            many_frames(project, 10);
            assert.equal(counter_value(), 11);
        });
    });
});
