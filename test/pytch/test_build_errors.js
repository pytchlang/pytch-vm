"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    assertBuildError,
    assertBuildErrorFun,
    import_deindented,
} = require("./pytch-testing.js");
configure_mocha();

////////////////////////////////////////////////////////////////////////////////
//
// Build-error handling.

describe("build-error handling", () => {
    with_project("py/project/no_import_pytch.py", (import_project) => {
        it("raises error if no import pytch", async () => {
            // The import_project function returns a promise, so we
            // can directly use it as the first arg to assert.rejects().
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("import", Sk.builtin.ImportError, /import pytch/)
            );
        });
    });

    with_project("py/project/bad_costume_for_auto_configure.py", (import_project) => {
        it("raises error if missing costume", async () => {
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("register-actor",
                                    Sk.pytchsupport.PytchAssetLoadError,
                                    /angry-alien/)
            );
        });
    });

    with_project("py/project/bad_project_class.py", (import_project) => {
        it("raises error from instantiating Project", async () => {
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("create-project")
            );
        });
    });

    with_project("py/project/bad_actor_init.py", (import_project) => {
        it("raises error from instantiating sprite", async () => {
            await assert.rejects(
                import_project(),
                (err) => {
                    assertBuildError(err, "register-actor");
                    assert.equal(err.phaseDetail.kind, "Sprite");
                    assert.equal(err.phaseDetail.className, "Problem");
                    return true;
                }
            );
        });
    });

    [
        {
            user_function: "show_variable",
            args_fragment: "(None, \"foo\")",
            syscall: "_show_object_attribute",
        },
        {
            user_function: "hide_variable",
            args_fragment: "(None, \"foo\")",
            syscall: "_hide_object_attribute",
        },
        {
            user_function: "broadcast",
            args_fragment: "(\"hello-world\")",
        },
        {
            user_function: "broadcast_and_wait",
            args_fragment: "(\"hello-world\")",
        },
        {
            user_function_owner: "Sprite",
            user_function: "start_sound",
            args_fragment: "(None, \"beep-beep\")",
            syscall: "play_sound",
        },
        {
            user_function_owner: "Sprite",
            user_function: "play_sound_until_done",
            args_fragment: "(None, \"beep-beep\")",
            syscall: "play_sound",
        },
        {
            user_function: "wait_seconds",
            args_fragment: "(1.0)",
        },
        {
            user_function: "create_clone_of",
            args_fragment: "(None)",
            syscall: "register_sprite_instance",
        },
        {
            user_function: "ask_and_wait",
            args_fragment: "(None)",
        },
    ].forEach(spec => {
        it(`rejects ${spec.user_function}() at top level`, async () => {
            const syscall = spec.syscall || spec.user_function;
            const qualifier = (
                spec.user_function_owner != null
                    ? `${spec.user_function_owner}.`
                    : ""
            );
            const assertDetails = assertBuildErrorFun(
                "import",
                Sk.builtin.RuntimeError,
                new RegExp(
                    `${syscall}\\(\\):`
                    + " must be called while running a Pytch thread.*"
                    + `did you call.*${spec.user_function}`
                )
            );
            const do_import = import_deindented(`
                import pytch
                pytch.${qualifier}${spec.user_function}${spec.args_fragment}
            `)
            await assert.rejects(do_import, assertDetails);
        });
    });

    it("gives error if no Backdrops in Stage", async () => {
        const import_project = import_deindented(`
            import pytch
            class Banana(pytch.Stage):
                pass
        `);

        await assert.rejects(
            import_project,
            assertBuildErrorFun(
                "register-actor",
                Sk.builtin.ValueError,
                /no Backdrops .* Stage class "Banana"/
            )
        );
    });

    [
        {
            label: "empty-string",
            arg: '""',
            error_regexp: /must not be an empty string/
        },
        { 
            label: "capital-letter",
            arg: '"W"',
            error_regexp: /must be a valid key; did you mean "w"/ 
        },
        {
            label: "misspelled-key",
            arg: '" w "',
            error_regexp: /must be a valid key; did you mean "w"/
        },
        {
            label: "misspelled-key",
            arg: '" w+ "',
            error_regexp: /must be a valid key; did you mean "w"/ },

        {
            label: "misspelled-key",
            arg: '" ArrowUp"',
            error_regexp: /must be a valid key; did you mean "ArrowUp"/
        },
        {
            label: "misspelled-key",
            arg: '"arrowUp"',
            error_regexp: /must be a valid key; did you mean "ArrowUp"/ 
        },
        
        {
            label: "misspelled-key",
            arg: '"arrow-up"',
            error_regexp: /must be a valid key; did you mean "ArrowUp"/ 
        },
        {
            label: "misspelled-key",
            arg: '"   "',
            error_regexp: /must be a valid key; if you meant the spacebar, use " "/ },

        {
            label: "invalid-key",
            arg: '"!"',
            error_regexp: /must be a valid key; you can use keys/ 
        },
        {
            label: "no-string",
            arg: "1",
            error_regexp: /must be a string/ 
        },
    ].forEach(spec => {
        it(`rejects bad arg to when_key_pressed(${spec.arg}) (${spec.label})`,
        async () => {
            const import_project = import_deindented(`
                import pytch
                @pytch.when_key_pressed(${spec.arg})
                def invalid_hat():
                    pass
            `);

            await assert.rejects(
                import_project,
                assertBuildErrorFun(
                    "import",
                    Sk.builtin.ValueError,
                    spec.error_regexp
                )
            );
        });
    });
});
