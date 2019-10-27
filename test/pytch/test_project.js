"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.project'

describe("pytch.project module", () => {
    it("can be imported", () => {
        let import_result = import_local_file("py/project/just_import.py");
        assert.ok(import_result.$d.pytch_project);
    });

    it("can create a Project", () => {
        let import_result = import_local_file("py/project/create_Project.py");
        assert.ok(import_result.$d.project);
    });

    it("can register a Sprite class", () => {
        let import_result = import_local_file("py/project/single_sprite.py");
        let project = import_result.$d.project.js_project;
        assert.strictEqual(project.actors.length, 1);
    });
});
