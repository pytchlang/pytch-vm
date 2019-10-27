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
    });
});
