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

        let actor_0 = project.actors[0];
        assert.strictEqual(actor_0.instances.length, 1);

        let instance_0 = actor_0.instances[0];
        assert.strictEqual(instance_0.js_attr("n_clicks"), 0);
    });
});
