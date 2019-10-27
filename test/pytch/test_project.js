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

        assert.equal(actor_0.event_handlers.green_flag.n_handlers, 1);
        let green_flag_handler = actor_0.event_handlers.green_flag.handlers[0];

        assert.strictEqual(green_flag_handler.pytch_actor, actor_0);
        assert.strictEqual(green_flag_handler.py_func,
                           import_result.$d.FlagClickCounter.note_click);
    });

    describe("can look up Actors by name", () => {
        const project = () => (
            (import_local_file("py/project/bad_registrations.py")
             .$d
             .project
             .js_project));

        it("can find unique Actor", () => {
            let banana = project().actor_by_class_name("Banana");
            assert.strictEqual(js_getattr(banana.py_cls, "colour"), "yellow");
        });

        it("rejects an unknown Actor", () => {
            assert.throws(() => project().actor_by_class_name("Spaceship"),
                          /no PytchActors with name "Spaceship"/);
        });

        it("rejects a duplicate Actor", () => {
            assert.throws(() => project().actor_by_class_name("Alien"),
                          /duplicate PytchActors with name "Alien"/);
        });
    });
});
