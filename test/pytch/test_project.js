"use strict";

const {
    configure_mocha,
    with_module,
    with_project,
    assert,
    py_getattr,
    js_getattr,
    appearance_by_name,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.project'

describe("pytch.project module", () => {
    with_module("py/project/just_import.py", (import_module) => {
        it("can be imported", async () => {
            let import_result = await import_module();
            assert.ok(import_result.$d.pytch_project);
        })});

    with_module("py/project/create_Project.py", (import_module) => {
        it("can create a Project", async () => {
            let import_result = await import_module();
            assert.ok(import_result.$d.project);
        })});

    with_project("py/project/single_sprite.py", (import_project) => {
        it("can register a Sprite class", async () => {
            let project = await import_project();
            assert.strictEqual(project.actors.length, 1);

            let actor_0 = project.actors[0];
            assert.strictEqual(actor_0.instances.length, 1);

            let instance_0 = actor_0.instances[0];
            assert.strictEqual(instance_0.js_attr("n_clicks"), 0);

            assert.equal(actor_0.event_handlers.green_flag.n_handlers, 1);
            let green_flag_handler = actor_0.event_handlers.green_flag.handlers[0];

            assert.strictEqual(green_flag_handler.pytch_actor, actor_0);
            assert.strictEqual(
                green_flag_handler.py_func,
                py_getattr(actor_0.py_cls, "note_click")
            );
        })});

    with_module("py/project/single_sprite.py", (import_module) => {
        it("populates parent-project inside Sprite class", async () => {
            let import_result = await import_module();
            let py_project = import_result.$d.project;
            let project = py_project.js_project;
            let py_counter = project.actor_by_class_name("FlagClickCounter").py_cls;
            let py_parent_project = py_getattr(py_counter, "_pytch_parent_project");
            assert.strictEqual(py_parent_project, py_project);
        })});

    with_project("py/project/custom_stage.py", (import_project) => {
        it("can register a Stage class", async () => {
            let project = await import_project();
            assert.strictEqual(project.actors.length, 1);

            let actor_0 = project.actors[0];
            assert.strictEqual(actor_0.instances.length, 1);

            let instance_0 = actor_0.instances[0];
            assert.strictEqual(instance_0.js_attr("colour"), "red");
        })});

    with_project("py/project/sprite_on_stage.py", (import_project) => {
        it("can register Sprite and Stage", async () => {
            let project = await import_project();

            // Even though we registered Table after Banana, Table should
            // end up in the first slot.
            var table = project.actor_by_class_name("Table");
            assert.strictEqual(table, project.actors[0]);

            // And Banana in the second.
            var banana = project.actor_by_class_name("Banana");
            assert.strictEqual(banana, project.actors[1]);

            // Their Costume and Backdrop should have been picked out OK.
            assert.strictEqual(appearance_by_name(banana, "yellow").centre_x, 50);
            assert.strictEqual(appearance_by_name(table, "wooden").centre_x, 240);
        })});

    with_project("py/project/bad_registrations.py", (import_project) => {
        describe("can look up Actors by name", async () => {
            it("can find unique Actor", async () => {
                let project = await import_project();
                let banana = project.actor_by_class_name("Banana");
                assert.strictEqual(js_getattr(banana.py_cls, "colour"), "yellow");
            });

            it("rejects an unknown Actor", async () => {
                let project = await import_project();
                assert.throws(() => project.actor_by_class_name("Spaceship"),
                              /no PytchActors with name "Spaceship"/);
            });

            it("rejects a duplicate Actor", async () => {
                let project = await import_project();
                assert.throws(() => project.actor_by_class_name("Alien"),
                              /duplicate PytchActors with name "Alien"/);
            });
        })});

    with_project("py/project/go_live_empty_project.py", (import_project) => {
        it("can go-live an empty Project", async () => {
            let project = await import_project();
            assert.strictEqual(Sk.pytch.current_live_project, project);
        })});
});
