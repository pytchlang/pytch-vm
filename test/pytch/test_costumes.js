"use strict";

const {
    configure_mocha,
    with_module,
    with_project,
    import_deindented,
    assert,
    assert_Appearance_equal,
    assert_renders_as,
    assertBuildErrorFun,
    many_frames,
    one_frame,
    appearance_by_name,
    pytch_errors,
    pytch_stdout,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Costume handling

describe("Costume handling", () => {
    with_project("py/project/some_costumes.py", (import_project) => {
        it("can load costumes", async () => {
            let project = await import_project();
            let alien = project.actor_by_class_name("Alien");

            assert.strictEqual(alien.n_appearances, 2);

            assert_Appearance_equal(appearance_by_name(alien, "marching"),
                                    "marching",
                                    "marching-alien.png",
                                    60, 20, 30, 10);

            assert_Appearance_equal(appearance_by_name(alien, "firing"),
                                    "firing",
                                    "firing-alien.png",
                                    80, 30, 40, 15);
        });

        it("can access costume info from Python side", async () => {
            let project = await import_project();

            // We print costumes in a loop so need multiple frames to do so:
            project.do_synthetic_broadcast("print-costume-info");
            many_frames(project, 2);

            const stdout = pytch_stdout.drain_stdout();
            assert.equal(
                stdout,
                ("0, marching, marching-alien.png, (60, 20), (30, 10)\n"
                 + "1, firing, firing-alien.png, (80, 30), (40, 15)\n"));
        });

        const assert_info_fun = (project, message) => (exp_stdout) => {
            project.do_synthetic_broadcast(message);
            one_frame(project);
            const stdout = pytch_stdout.drain_stdout();
            assert.equal(stdout, exp_stdout);
        };

        it("can read current costume info", async () => {
            let project = await import_project();
            const assert_info = assert_info_fun(project, "print-current-costume");

            // Initial state is the first costume.
            assert_info("0 marching\n");

            project.do_synthetic_broadcast("switch-to-firing")
            assert_info("1 firing\n");

            project.do_synthetic_broadcast("switch-to-marching")
            assert_info("0 marching\n");
        });

        it("can read current backdrop info", async () => {
            let project = await import_project();
            const assert_info = assert_info_fun(project, "print-current-backdrop");

            // Initial state is the first backdrop.
            assert_info("0 wooden-stage\n");

            project.do_synthetic_broadcast("switch-to-sky")
            assert_info("1 sunny-sky\n");

            project.do_synthetic_broadcast("switch-to-white")
            assert_info("2 solid-white-stage\n");

            project.do_synthetic_broadcast("switch-to-wooden")
            assert_info("0 wooden-stage\n");
        });

        it("can switch costume by number", async () => {
            let project = await import_project();
            const assert_info = assert_info_fun(project, "switch-costume-by-number");
            assert_info("1 firing\n"
                        + "0 marching\n"
                        + "1 firing\n");
        });

        it("can switch backdrop by number", async () => {
            let project = await import_project();
            const assert_info = assert_info_fun(project, "switch-backdrop-by-number");
            assert_info("1 sunny-sky\n"
                        + "0 wooden-stage\n"
                        + "1 sunny-sky\n"
                        + "2 solid-white-stage\n"
                        + "1 sunny-sky\n");
        });
    });

    [
        { base: "Sprite", attrname: "Costumes", methodname: "switch_costume" },
        { base: "Stage", attrname: "Backdrops", methodname: "switch_backdrop" },
    ].forEach(kind => {
        [
            { label: "list", arg: "[1, 2, 3]", error_regexp: /must be string or integer/ },
            { label: "float", arg: "2.718", error_regexp: /must be string or integer/ },
            { label: "too-low-int", arg: "-1", error_regexp: /can not be negative/ },
            { label: "too-high-int", arg: "3", error_regexp: /it only has 3/ },
        ].forEach(spec => {
            it(`rejects bad arg to ${kind.base}.${kind.methodname} (${spec.label})`,
               async () => {
                   const project = await import_deindented(`

                       import pytch

                       class Banana(pytch.${kind.base}):
                           ${kind.attrname} = [
                               "wooden-stage.png",
                               "sunny-sky.png",
                               "solid-white-stage.png",
                           ]

                           @pytch.when_I_receive("cause-trouble")
                           def cause_trouble(self):
                               self.${kind.methodname}(${spec.arg})
                   `);

                   project.do_synthetic_broadcast("cause-trouble");
                   one_frame(project);

                   pytch_errors.assert_sole_error_matches(spec.error_regexp);
               });
        });
    });

    [
        {
            base: "Sprite",
            attrname: "Costumes",
            switch_methodname: "switch_costume",
            next_methodname: "next_costume",
        },
        {
            base: "Stage",
            attrname: "Backdrops",
            switch_methodname: "switch_backdrop",
            next_methodname: "next_backdrop",
        },
    ].forEach(kind => {
        [
            { label: "default-arg", n_steps_fragment: "", exp_number: 2 },
            { label: "by 0", n_steps_fragment: "0", exp_number: 1 },
            { label: "by 1", n_steps_fragment: "1", exp_number: 2 },
            { label: "by 2", n_steps_fragment: "2", exp_number: 0 },
            { label: "by 3", n_steps_fragment: "3", exp_number: 1 },
            { label: "by -1", n_steps_fragment: "-1", exp_number: 0 },
            { label: "by 301", n_steps_fragment: "301", exp_number: 2 },
            { label: "by -299", n_steps_fragment: "-299", exp_number: 2 },
            {
                label: "error if non-int",
                n_steps_fragment: "2.5",
                error_regexp: /must be integer/,
            },
        ].forEach(spec => {
            it(`can step onwards in ${kind.attrname} list (${spec.label})`,
               async () => {
                   const project = await import_deindented(`

                       import pytch

                       class Banana(pytch.${kind.base}):
                           ${kind.attrname} = [
                               "wooden-stage.png",
                               "sunny-sky.png",
                               "solid-white-stage.png",
                           ]

                           @pytch.when_I_receive("next")
                           def advance_appearance(self):
                               self.${kind.switch_methodname}(1)
                               self.${kind.next_methodname}(${spec.n_steps_fragment})
                               print(self.appearance_number)
                   `);

                   project.do_synthetic_broadcast("next");
                   one_frame(project);

                   if (spec.exp_number !== undefined) {
                       const stdout = pytch_stdout.drain_stdout();
                       assert.equal(stdout, `${spec.exp_number}\n`);
                   } else {
                       pytch_errors.assert_sole_error_matches(spec.error_regexp);
                   }
               });
        });
    });

    it("gives useful error for next_costume() when no Costumes", async () => {
        const project = await import_deindented(`

            import pytch
            class InvisibleBanana(pytch.Sprite):
                Costumes = []
                @pytch.when_I_receive("try-next")
                def try_next_costume(self):
                    self.next_costume()
        `);

        project.do_synthetic_broadcast("try-next");
        one_frame(project);
        pytch_errors.assert_sole_error_matches(/has no Costumes/);
    });

    with_module("py/project/bad_costume.py", (import_module) => {
        it("throws Python error if costume not found", async () => {
            let module = await import_module();
            let caught_exception = module.$d.caught_exception;
            let err_msg = new Sk.builtin.str(caught_exception).v;
            assert.ok(/could not load Image/.test(err_msg));
            assert.equal(caught_exception.kind, "Image");
        });
    });

    const bad_Backdrop_cases = [
        {
            label: "four-element tuple",
            fragment: "('night', 'some-url', 'extra', 'elements')",
            error_regexp: /Backdrop.*must have 1 or 2 elements/,
        },
        {
            label: "neither tuple nor string",
            fragment: "42",
            error_regexp: /Backdrop.*must be tuple or string/,
        },
    ];

    bad_Backdrop_cases.forEach(spec => {
    it(`throws Python error if Backdrop spec malformed (${spec.label})`, async () => {
        await assert.rejects(
            import_deindented(`

                import pytch
                class Sky(pytch.Stage):
                    Backdrops = [${spec.fragment}]
            `),
            assertBuildErrorFun("register-actor",
                                Sk.builtin.ValueError,
                                spec.error_regexp));
    })});

    const bad_Costume_cases = [
        {
            label: "neither tuple nor string",
            fragment: "42",
            error_regexp: /Costume.*must be tuple or string/,
        },
        {
            label: "centre-x not a number",
            fragment: "('square', 'square.png', 'banana', 42)",
            error_regexp: /Costume.*must be numbers/,
        },
        {
            label: "label (4-tuple) not a string",
            fragment: "(42, 'square.png', 10, 10)",
            error_regexp: /Costume.*label.*\(first.*of four.*\).*must be a string/,
        },
        {
            label: "filename (4-tuple) not a string",
            fragment: "('square', 3.141, 10, 10)",
            error_regexp: /Costume.*filename.*\(second.*of four.*\).*must be a string/,
        },
        {
            label: "filename (3-tuple) not a string",
            fragment: "(3.141, 10, 10)",
            error_regexp: /Costume.*filename.*\(first.*of three.*\).*must be a string/,
        },
        {
            label: "label (2-tuple) not a string",
            fragment: "(3.141, 'square.png')",
            error_regexp: /Costume.*label.*\(first.*of two.*\).*must be a string/,
        },
        {
            label: "filename (2-tuple) not a string",
            fragment: "('square', 1.0)",
            error_regexp: /Costume.*filename.*\(second.*of two.*\).*must be a string/,
        },
        {
            label: "filename (1-tuple) not a string",
            fragment: "(1.0,)",
            error_regexp: /Costume.*filename.*\(sole.*of one.*\).*must be a string/,
        },
    ];

    bad_Costume_cases.forEach(spec => {
    it(`throws Python error if Costume spec malformed (${spec.label})`, async () => {
        await assert.rejects(
            import_deindented(`

                import pytch
                class Alien(pytch.Sprite):
                    Costumes = [${spec.fragment}]
            `),
            assertBuildErrorFun("register-actor",
                                Sk.builtin.ValueError,
                                spec.error_regexp));
    })});

    with_project("py/project/some_costumes.py", (import_project) => {
        [
            { tag: "None", error_regexp: /a number/ },
            { tag: "string", error_regexp: /a number/ },
            { tag: "non-integer", error_regexp: /an integer/ },
            { tag: "out-of-range-low", error_regexp: /in the range/ },
            { tag: "out-of-range-high", error_regexp: /in the range/ },
        ].forEach(spec => {
            it(`does something if appearance-index ${spec.tag}`, async () => {
                let project = await import_project();

                const message = `set-appearance-index-attribute-${spec.tag}`;
                project.do_synthetic_broadcast(message);
                project.one_frame();

                project.rendering_instructions();

                pytch_errors.assert_sole_error_matches_all([
                    /appearance-index must be/,
                    spec.error_regexp
                ]);
            });
        });
    });

    const bad_switch_test_specs = [
        { tag: 'costume',
          message: 'switch-costume',
          error_regexp: /could not find Costume "angry" in class "Alien"/ },
        { tag: 'backdrop',
          message: 'switch-backdrop',
          error_regexp: /could not find Backdrop "plastic" in class "Table"/ },
    ];

    with_project("py/project/switch_to_bad_costume.py", (import_project) => {
        bad_switch_test_specs.forEach(spec => {
            it(`throws Python error on switching to unknown ${spec.tag}`, async () => {
                let project = await import_project();

                project.do_synthetic_broadcast(spec.message);
                one_frame(project);

                pytch_errors.assert_sole_error_matches(spec.error_regexp);
            })})});

    with_project("py/project/default_appearance.py", (import_project) => {
        it("uses first appearance by default", async () => {
            let project = await import_project();

            let ball = project.instance_0_by_class_name("Ball");
            assert.equal(ball.js_attr("_appearance_index"), 0);

            let table = project.instance_0_by_class_name("Table");
            assert.equal(table.js_attr("_appearance_index"), 0);
        })});

    with_project("py/project/sprite_without_costumes.py", (import_project) => {
        it("allows creation but not show of costume-less Sprite", async () => {
            // Even though this project contains a Sprite with no Costumes, it
            // should be fine to import it and create an instance of that Sprite.
            let project = await import_project();

            // Nothing should happen if we run a few frames.
            many_frames(project, 3);
            assert.strictEqual(pytch_errors.drain_errors().length, 0);

            // But asking the costume-less sprite to show itself should produce an
            // error.
            project.do_synthetic_broadcast("show-yourself");
            one_frame(project);

            pytch_errors.assert_sole_error_matches(/cannot show .* no Costumes/);
        })});

    with_project("py/project/stage_without_backdrops.py", (import_project) => {
        it("rejects creation of backdrop-less Stage", async () => {
            await assert.rejects(
                import_project());
        })});

    const alien_code = (start_shown, include_costume) => `
        import pytch
        class Alien(pytch.Sprite):
             start_shown = ${start_shown ? "True" : "False"}
             Costumes = [${include_costume ? '"firing-alien.png"' : ""}]
    `;

    it("obeys start_shown True when has Costumes", async () => {
        const project = await import_deindented(alien_code(true, true));
        assert_renders_as("start", project,
                          [["RenderImage", -40, 15, 1, "firing-alien"]]);
    });

    it("obeys start_shown False when has Costumes", async () => {
        const project = await import_deindented(alien_code(false, true));
        assert_renders_as("start", project, []);
    });

    it("rejects start_shown True when no Costumes", async () => {
        await assert.rejects(
            import_deindented(alien_code(true, false)),
            assertBuildErrorFun("register-actor",
                                Sk.builtin.ValueError,
                                /start_shown.*but.*Costumes/));
    });

    it("obeys start_shown False when no Costumes", async () => {
        const project = await import_deindented(alien_code(false, false));
        assert_renders_as("start", project, []);
    });

    it("sets costume under start-not-shown", async () => {
        const base_code = alien_code(false, true);
        const complete_code = base_code + `
             @pytch.when_green_flag_clicked
             def reveal(self):
                 self.show()
        `;
        const project = await import_deindented(complete_code);
        assert_renders_as("start", project, []);
        project.on_green_flag_clicked()
        one_frame(project)
        assert_renders_as("after-green-flag", project,
                          [["RenderImage", -40, 15, 1, "firing-alien"]]);
    });

});
