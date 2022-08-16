"use strict";

const {
    configure_mocha,
    import_deindented,
    js_getattr,
    one_frame,
    assert,
    assertBuildErrorFun,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Use of 'for' and 'while' loops at top level of module

describe("Use of for/while loops at module top-level", () => {
    const for_loop_code = `# Use for loop
                for i in range(5):
                    global_x += i
    `;

    const while_loop_code = `# Use while loop
                i = 0
                while i < 5:
                    global_x += i
                    i += 1
    `;

    [
        { label: 'for loop', code: for_loop_code },
        { label: 'while loop', code: while_loop_code },
    ].forEach(spec =>
        it(`allows top-level loop (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch

                global_x = 0
                ${spec.code}

                class Banana(pytch.Sprite):
                    Costumes = []

                    @pytch.when_I_receive("read-x")
                    def read_x(self):
                        self.x = global_x
            `);

            const banana_0 = project.instance_0_by_class_name("Banana");
            const current_x = () => js_getattr(banana_0.py_object, "x");

            project.do_synthetic_broadcast("read-x");
            one_frame(project);
            assert.strictEqual(current_x(), 0 + 1 + 2 + 3 + 4);
        })
    );

    it("handles top-level infinite loop", async () => {
        const import_project = import_deindented(`

            import pytch

            while True:
                pass
        `);

        await assert.rejects(
            import_project,
            assertBuildErrorFun(
                "import",
                Sk.builtin.RuntimeError,
                /loop iterations.*maximum allowed/
            )
        );
    });

    [
        {
            label: "for",
            fragment_lines: ["for i in range(n_iters):", "    pass"],
        },
        {
            label: "while",
            fragment_lines: ["i = 0", "while i < n_iters:", "    i += 1"],
        },
    ].forEach(spec => {
        describe(`control of max top-level loop iters (${spec.label})`, () => {
            const program_code = (maybe_max, n_iters) => {
                const set_max_fragment =
                      ((maybe_max == null)
                       ? ""
                       : `pytch.set_max_import_loop_iterations(${maybe_max})`);

                const body = spec.fragment_lines.join("\n                    ");
                return `
                    import pytch
                    ${set_max_fragment}
                    n_iters = ${n_iters}
                    ${body}
                `;
            };

            const assert_error_fun = assertBuildErrorFun(
                "import",
                Sk.builtin.RuntimeError,
                /loop iterations.*maximum allowed/
            );

            it("allows iters within limit", async () => {
                await import_deindented(program_code(null, 1000));
                // Test is just that this runs OK.
            });

            it("rejects iters exceeding limit", async () => {
                const import_project = import_deindented(program_code(null, 1001));
                await assert.rejects(import_project, assert_error_fun);
            });

            it("can override max (iters within limit)", async () => {
                await import_deindented(program_code(1200, 1200));
                // Test is just that this runs OK.
            });

            it("can override max (iters exceeding limit)", async () => {
                const import_project = import_deindented(program_code(200, 201));
                await assert.rejects(import_project, assert_error_fun);
            });

            it("can override max to zero (no iters)", async () => {
                await import_deindented(program_code(0, 0));
                // Test is just that this runs OK.
            });

            it("can override max to zero (one iter)", async () => {
                const import_project = import_deindented(program_code(0, 1));
                await assert.rejects(import_project, assert_error_fun);
            });
        });
    });

    [
        {
            label: "string",
            fragment: "'foo'",
            error_type: Sk.builtin.TypeError,
            error_re: /must be a number/,
        },
        {
            label: "lambda",
            fragment: "lambda x: 42",
            error_type: Sk.builtin.TypeError,
            error_re: /must be a number/,
        },
        {
            label: "non-integer",
            fragment: "2.25",
            error_type: Sk.builtin.ValueError,
            error_re: /must be integer/,
        },
        {
            label: "negative",
            fragment: "-1",
            error_type: Sk.builtin.ValueError,
            error_re: /must be non-negative/,
        },
    ].forEach(spec => {
        it("set_max_import_loop_iterations() rejects bad arg"
           + ` (${spec.label})`,
           async () => {
               const import_project = import_deindented(`

                   import pytch
                   pytch.set_max_import_loop_iterations(${spec.fragment})
               `);

               await assert.rejects(
                   import_project,
                   assertBuildErrorFun(
                       "import",
                       spec.error_type,
                       spec.error_re
                   )
               );
           }
        );
    });
});
