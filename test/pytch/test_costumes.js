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

    it("rejects unknown costume", async () => {
        let project = await import_project("py/project/some_costumes.py");
        let alien = project.actor_by_class_name("Alien");

        assert.throws(() => alien.appearance_from_name("banana"),
                      /could not find Costume "banana" in class "Alien"/);
    });
});
