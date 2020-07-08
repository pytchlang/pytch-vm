"use strict";

const {
    configure_mocha,
    with_module,
    assert,
    js_getattr,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Auto-registration helpers

describe("auto-registration", () => {
    with_module("py/project/go_live_empty_project.py", (import_module) => {
        it("finds the imported pytch", async () => {
            let module = await import_module();
            let got_pytch = Sk.pytchsupport.pytch_in_module(module);
            assert.ok(got_pytch);
        });
    });

    with_module("py/project/no_import_pytch.py", (import_module) => {
        it("detects lack of \"import pytch\"", async () => {
            let module = await import_module();
            assert.throws(() => Sk.pytchsupport.pytch_in_module(module),
                          /does not do "import pytch"/);
        });
    });

    const actor_class_name = (actor => js_getattr(actor.cls, "__name__"));

    const cmp_actor_class_names = (a, b) => {
        let a_name = actor_class_name(a);
        let b_name = actor_class_name(b);
        if (a_name < b_name)
            return -1;
        if (a_name > b_name)
            return 1;
        return 0;
    };

    with_module("py/project/sprite_on_stage.py", (import_module) => {
        it("finds actors in module", async () => {
            let module = await import_module();

            let got_actors = Sk.pytchsupport.actors_of_module(module);
            got_actors.sort(cmp_actor_class_names);

            assert.strictEqual(actor_class_name(got_actors[0]), "Banana");
            assert.strictEqual(got_actors[0].kind, "Sprite");

            assert.strictEqual(actor_class_name(got_actors[1]), "Table");
            assert.strictEqual(got_actors[1].kind, "Stage");
        });
    });

    with_module("py/project/no_create_project.py", (import_module) => {
        it("detects lack of Project", async () => {
            let module = await import_module();
            assert.ok(! Sk.pytchsupport.module_has_Project_instance(module));
        });
    });

    with_module("py/project/sprite_on_stage.py", (import_module) => {
        it("detects a Project", async () => {
            let module = await import_module();
            assert.ok(Sk.pytchsupport.module_has_Project_instance(module));
        });
    });

    // This is a fairly weak test.  We test the mechanism more thoroughly with
    // the 'cut-here' mechanism; see details in with_project() in the file
    // pytch-testing.js.
    with_module("py/project/sprite_on_stage_no_config.py", (import_module) => {
        it("auto-configures Project", async () => {
            let module = await import_module();
            assert.ok(! Sk.pytchsupport.module_has_Project_instance(module));
            await Sk.pytchsupport.maybe_auto_configure_project(module);
            assert.ok(Sk.pytchsupport.module_has_Project_instance(module));
        });
    });
});
