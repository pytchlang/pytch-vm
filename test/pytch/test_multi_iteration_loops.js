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
    [
        { iters_per_frame: 5, exp_ns: [5, 10, 15, 21, 22] },
        { iters_per_frame: 8, exp_ns: [8, 16, 21, 22, 23] },
        { iters_per_frame: 10, exp_ns: [10, 21, 22, 23, 24] },
        { iters_per_frame: 19, exp_ns: [19, 21, 22, 23, 24] },
        { iters_per_frame: 20, exp_ns: [21, 22, 23, 24, 25] },
        { iters_per_frame: 50, exp_ns: [21, 22, 23, 24, 25] },
    ].forEach(spec => {
        const detail = `${spec.iters_per_frame} iters/frame`;
        it(`obeys loop-yielding-strategy (${detail})`, async () => {
            const n_iters = spec.iters_per_frame;
            const project = await import_deindented(`

                import pytch
                from pytch.syscalls import (
                    push_loop_iterations_per_frame,
                    pop_loop_iterations_per_frame,
                )

                class Counter(pytch.Sprite):
                    Costumes = []

                    @pytch.when_I_receive("run")
                    def run(self):
                        push_loop_iterations_per_frame(${n_iters})
                        self.n = 0
                        for i in range(20):
                            self.n += 1
                        pop_loop_iterations_per_frame()
                        for i in range(5):
                            self.n += 1
            `);

            const counter_0 = project.instance_0_by_class_name("Counter");
            const current_n = () => js_getattr(counter_0.py_object, "n");

            project.do_synthetic_broadcast("run");
            let got_ns = [];
            for (let i = 0; i < 5; ++i) {
                one_frame(project);
                got_ns.push(current_n());
            }

            assert.deepEqual(got_ns, spec.exp_ns);
        });
    });
});
