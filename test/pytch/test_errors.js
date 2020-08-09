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

    with_project("py/project/multiple_errors.py", (import_project) => {
        it("stops everything on error", async () => {
            let project = await import_project();
            let banana = project.instance_0_by_class_name("Banana");

            const n_ticks = () => js_getattr(banana.py_object, "n_ticks");

            const assert_n_ticks
                  = (exp_n_ticks) => assert.equal(n_ticks(), exp_n_ticks);

            project.do_synthetic_broadcast("go");
            project.one_frame();

            // We should have done the first iteration of the 'while'.
            assert_n_ticks(1);

            let thrown_errors = [];
            for (let i = 0; i != 50; ++i) {
                project.one_frame();
                thrown_errors = pytch_errors.drain_errors();
                if (thrown_errors.length > 0)
                    break;
            }

            assert.ok(thrown_errors.length == 3,
                      "should have thrown 3 errors within 50 frames");

            const n_ticks_when_errors_thrown = n_ticks();

            many_frames(project, 20);

            assert.equal(n_ticks(), n_ticks_when_errors_thrown,
                         "Banana should stop ticking once errors thrown");
        });
    });
});
