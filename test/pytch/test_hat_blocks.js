"use strict";

const {
    configure_mocha,
    with_module,
    with_project,
    assert,
    py_getattr,
    import_deindented,
    one_frame,
    mock_keyboard,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.hat_blocks'

describe("pytch.hat_blocks module", () => {
    class EventsHandledBy {
        constructor(py_cls, js_method_name) {
            let method = py_getattr(py_cls, js_method_name);
            let py_handler_attr = py_getattr(method, "_pytch_handler_for");
            assert.ok(py_handler_attr);
            this.events_handled = Sk.ffi.remapToJs(py_handler_attr);
        }

        get n_events() {
            return this.events_handled.length;
        }

        includes(evt_type, evt_data) {
            return (this.events_handled
                    .some(([type, data]) =>
                          (type === evt_type && data === evt_data)));
        }
    }

    with_module("py/project/single_sprite.py", (import_module) => {
        let single_sprite_project = async () => {
            let import_result = await import_module();
            let py_FlagClickCounter = py_getattr(import_result, "FlagClickCounter");
            return py_FlagClickCounter;
        };

        it("registers green-flag", async () => {
            let py_FlagClickCounter = await single_sprite_project();
            let note_click_evts = new EventsHandledBy(py_FlagClickCounter, "note_click");
            assert.strictEqual(note_click_evts.n_events, 1);
            assert.ok(note_click_evts.includes("green-flag", null));
        });

        it("registers when-I-receive", async () => {
            let py_FlagClickCounter = await single_sprite_project();
            let reset_n_clicks = new EventsHandledBy(py_FlagClickCounter, "reset_n_clicks");
            assert.strictEqual(reset_n_clicks.n_events, 1);
            assert.ok(reset_n_clicks.includes("message", "reset"));
        });

        it("registers when-key-pressed", async () => {
            let py_FlagClickCounter = await single_sprite_project();
            let forget_a_click = new EventsHandledBy(py_FlagClickCounter, "forget_a_click");
            assert.strictEqual(forget_a_click.n_events, 1);
            assert.ok(forget_a_click.includes("keypress", "x"));
        })});

    with_project("py/project/sprite_on_stage.py", (import_project) => {
        let sprite_on_stage = async () => {
            let project = await import_project();
            let banana = project.actor_by_class_name("Banana");
            let table = project.actor_by_class_name("Table");
            return {banana, table};
        };

        it("register sprite-clicked", async () => {
            let {banana, table} = await sprite_on_stage();
            let hello = new EventsHandledBy(banana.py_cls, "say_hello_banana");
            assert.strictEqual(hello.n_events, 1);
            assert.ok(hello.includes("click", null));
        });

        it("register stage-clicked", async () => {
            let {banana, table} = await sprite_on_stage();
            let hello = new EventsHandledBy(table.py_cls, "say_hello_table");
            assert.strictEqual(hello.n_events, 1);
            assert.ok(hello.includes("click", null));
        })});

    const validKeysList = [
        "a", "z", "0", " ",
        "ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"
    ];
    validKeysList.forEach(keyname => {
        it(`key_pressed("${keyname}") accepted`, async () => {
            const project = await import_deindented(`
                import pytch
                class A_Sprite(pytch.Sprite):
                    key_pressed = False
                    @pytch.when_key_pressed("${keyname}")
                    def do_something(self):
                        self.key_pressed = pytch.key_pressed("${keyname}")
            `);

            mock_keyboard.press_key(keyname);
            one_frame(project);
            mock_keyboard.release_key(keyname);
            let sprite_instance = project.instance_0_by_class_name("A_Sprite")
            assert.strictEqual(sprite_instance.js_attr("key_pressed"), true);
        });
    });
});
