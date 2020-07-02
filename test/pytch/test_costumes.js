"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Costume handling

describe("Costume handling", () => {
    it("can load costumes", async () => {
        let project = await import_project("py/project/some_costumes.py");
        let alien = project.actor_by_class_name("Alien");

        assert.strictEqual(alien.n_appearances, 2);

        assert_Appearance_equal(alien.appearance_from_name("marching"),
                                "library/images/marching-alien.png",
                                60, 20, 30, 10);

        assert_Appearance_equal(alien.appearance_from_name("firing"),
                                "library/images/firing-alien.png",
                                80, 30, 40, 15);
    });

    it("throws Python error if costume not found", async () => {
        let module = await import_local_file("py/project/bad_costume.py");
        let caught_exception = module.$d.caught_exception;
        let err_msg = Sk.builtin.str(caught_exception).v;
        assert.ok(/could not load image/.test(err_msg));
    });

    it("throws Python error if appearance-spec malformed", async () => {
        let module = await import_local_file("py/project/bad_appearance_spec.py");

        const assert_exception_matches = (obj_name, expected_regexp) => {
            let caught_exception = module.$d[obj_name];
            let err_msg = Sk.builtin.str(caught_exception).v;
            assert.ok(expected_regexp.test(err_msg));
        }

        assert_exception_matches("caught_exception_StarrySky",
                                 /Backdrop.*must have 2 elements/);

        assert_exception_matches("caught_exception_Alien",
                                 /Costume.*must have 4 elements/);

        assert_exception_matches("caught_exception_Spaceship",
                                 /Costume.*must be numbers/);
    });

    it("rejects unknown costume on direct look-up attempt", async () => {
        let project = await import_project("py/project/some_costumes.py");
        let alien = project.actor_by_class_name("Alien");

        assert.throws(() => alien.appearance_from_name("banana"),
                      /could not find Costume "banana" in class "Alien"/);
    });

    const bad_switch_test_specs = [
        { tag: 'costume',
          message: 'switch-costume',
          err_test: /could not find Costume "angry" in class "Alien"/ },
        { tag: 'backdrop',
          message: 'switch-backdrop',
          err_test: /could not find Backdrop "plastic" in class "Table"/ },
    ];

    bad_switch_test_specs.forEach(spec => {
    it(`throws Python error on switching to unknown ${spec.tag}`, async () => {
        let project = await import_project("py/project/switch_to_bad_costume.py");

        project.do_synthetic_broadcast(spec.message);
        project.one_frame();

        let errs = pytch_errors.drain_errors();
        assert.strictEqual(errs.length, 1);

        let err_str = errs[0].toString();
        assert.ok(spec.err_test.test(err_str));
    })});

    it("uses first appearance by default", async () => {
        let project = await import_project("py/project/default_appearance.py");

        let ball = project.instance_0_by_class_name("Ball");
        assert.equal(ball.js_attr("_appearance"), "yellow-ball");

        let table = project.instance_0_by_class_name("Table");
        assert.equal(table.js_attr("_appearance"), "wooden");
    });

    it("allows creation but not show of costume-less Sprite", async () => {
        // Even though this project contains a Sprite with no Costumes, it
        // should be fine to import it and create an instance of that Sprite.
        let project = await import_project("py/project/sprite_without_costumes.py");

        // Nothing should happen if we run a few frames.
        project.one_frame();
        project.one_frame();
        project.one_frame();
        assert.strictEqual(pytch_errors.drain_errors().length, 0);

        // But asking the costume-less sprite to show itself should produce an
        // error.
        project.do_synthetic_broadcast("show-yourself");
        project.one_frame();

        let errs = pytch_errors.drain_errors();
        assert.strictEqual(errs.length, 1);

        let err_str = errs[0].toString();
        assert.ok(/cannot show .* no Costumes/.test(err_str));
    });

    it("rejects creation of backdrop-less Stage", async () => {
        await assert.rejects(
            import_project("py/project/stage_without_backdrops.py"));
    });
});
