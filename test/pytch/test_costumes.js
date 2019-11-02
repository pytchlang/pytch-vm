"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Costume handling

describe("Costume handling", () => {
    it("can load costumes", async () => {
        let import_result
            = await import_local_file("py/project/some_costumes.py");
        let project = import_result.$d.project.js_project;
        let alien = project.actor_by_class_name("Alien");

        assert.strictEqual(alien.appearances.length, 2);

        let costumes = alien.appearances;

        assert.strictEqual(costumes[0][0], "marching");
        assert_Appearance_equal(costumes[0][1],
                                "library/images/marching-alien.png",
                                60, 20, 30, 10);

        assert.strictEqual(costumes[1][0], "firing");
        assert_Appearance_equal(costumes[1][1],
                                "library/images/firing-alien.png",
                                80, 30, 40, 15);
    });
});
