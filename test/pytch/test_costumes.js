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
});
