"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    pytch_errors,
    js_getattr,
    many_frames,
    one_frame,
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
            one_frame(project);

            let err = pytch_errors.sole_error();
            let err_str = err.err.toString();
            assert.ok(/Alien.*has no attribute.*boost_shields/.test(err_str));

            let err_ctx = err.ctx;
            assert.equal(err_ctx.callable_name, "do_something_bad");
            assert.equal(err_ctx.event_label, 'message "launch-invasion"');
        })});

    with_project("py/project/multiple_errors.py", (import_project) => {
        it("stops everything on error", async () => {
            let project = await import_project();
            let banana = project.instance_0_by_class_name("Banana");

            const n_ticks = () => js_getattr(banana.py_object, "n_ticks");

            const assert_n_ticks
                  = (exp_n_ticks) => assert.equal(n_ticks(), exp_n_ticks);

            project.do_synthetic_broadcast("go");
            one_frame(project);

            // We should have done the first iteration of the 'while'.
            assert_n_ticks(1);

            let thrown_errors = [];

            // Include the one we just did, and the one we do in the loop before
            // the "break":
            let n_frames = 2;

            for (; n_frames != 50; ++n_frames) {
                one_frame(project);
                thrown_errors = pytch_errors.drain_errors();
                if (thrown_errors.length > 0)
                    break;
            }

            assert.ok(thrown_errors.length == 3,
                      "should have thrown 3 errors within 50 frames");

            // On the threads which raise an exception, it takes one frame to
            // get into the wait_seconds(0.25) call.  The thread then spends 15
            // frame-times inside the wait_seconds(), and on the one_frame()
            // call after that, throws the error.  (The wait is how many
            // frame-times it waits for, NOT how many one_frame() calls it does
            // nothing.)
            assert.equal(n_frames, 16);

            const n_ticks_when_errors_thrown = n_ticks();

            many_frames(project, 20);

            assert.equal(n_ticks(), n_ticks_when_errors_thrown,
                         "Banana should stop ticking once errors thrown");
        });
    });
});
