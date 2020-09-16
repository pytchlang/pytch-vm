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

            let failing_sprites = thrown_errors.map(
                err => err.ctx.target_class_name);
            failing_sprites.sort();
            assert.deepEqual(failing_sprites, ["OtherProblem", "Problem"]);

            thrown_errors.forEach((rich_error) => {
                const msg = rich_error.err.toString();
                assert.ok(/'(Other)?Problem' object has no attribute/.test(msg));
                assert.equal(rich_error.err.traceback.length, 0);

                assert.equal(rich_error.ctx.kind, "render");
            });
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

            const error_ctx = thrown_errors[0].ctx;
            assert.equal(error_ctx.kind, "render");
            assert.equal(error_ctx.target_class_name, "Problem");

            many_frames(project, 10);
            assert.equal(counter_value(), 11);
        });
    });
});
