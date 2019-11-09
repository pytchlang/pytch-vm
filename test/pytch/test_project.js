"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.project'

describe("pytch.project module", () => {
    it("can be imported", async () => {
        let import_result = await import_local_file("py/project/just_import.py");
        assert.ok(import_result.$d.pytch_project);
    });

    it("can create a Project", async () => {
        let import_result = await import_local_file("py/project/create_Project.py");
        assert.ok(import_result.$d.project);
    });

    it("can register a Sprite class", async () => {
        let project = await import_project("py/project/single_sprite.py");
        assert.strictEqual(project.actors.length, 1);

        let actor_0 = project.actors[0];
        assert.strictEqual(actor_0.instances.length, 1);

        let instance_0 = actor_0.instances[0];
        assert.strictEqual(instance_0.js_attr("n_clicks"), 0);

        assert.equal(actor_0.event_handlers.green_flag.n_handlers, 1);
        let green_flag_handler = actor_0.event_handlers.green_flag.handlers[0];

        assert.strictEqual(green_flag_handler.pytch_actor, actor_0);
        assert.strictEqual(green_flag_handler.py_func, actor_0.py_cls.note_click);
    });

    it("populates parent-project inside Sprite class", async () => {
        let import_result = await import_local_file("py/project/single_sprite.py");
        let py_project = import_result.$d.project;
        let project = py_project.js_project;
        let py_counter = project.actor_by_class_name("FlagClickCounter").py_cls;
        let py_parent_project = py_getattr(py_counter, "_pytch_parent_project");
        assert.strictEqual(py_parent_project, py_project);
    });

    it("can register a Stage class", async () => {
        let project = await import_project("py/project/custom_stage.py");
        assert.strictEqual(project.actors.length, 1);

        let actor_0 = project.actors[0];
        assert.strictEqual(actor_0.instances.length, 1);

        let instance_0 = actor_0.instances[0];
        assert.strictEqual(instance_0.js_attr("colour"), "red");
    });

    describe("can look up Actors by name", async () => {
        const async_project = async () => {
            let project = await import_project("py/project/bad_registrations.py");
            return project;
        }

        it("can find unique Actor", async () => {
            let project = await async_project();
            let banana = project.actor_by_class_name("Banana");
            assert.strictEqual(js_getattr(banana.py_cls, "colour"), "yellow");
        });

        it("rejects an unknown Actor", async () => {
            let project = await async_project();
            assert.throws(() => project.actor_by_class_name("Spaceship"),
                          /no PytchActors with name "Spaceship"/);
        });

        it("rejects a duplicate Actor", async () => {
            let project = await async_project();
            assert.throws(() => project.actor_by_class_name("Alien"),
                          /duplicate PytchActors with name "Alien"/);
        });
    });

    it("can go-live an empty Project", async () => {
        let project = await import_project("py/project/go_live_empty_project.py");
        assert.strictEqual(Sk.pytch.current_live_project, project);
    });
});
