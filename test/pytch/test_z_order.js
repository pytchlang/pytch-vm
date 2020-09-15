"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    many_frames,
    js_getattr,
    mock_mouse,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Z-Order operations

describe("z-order operations", () => {
    with_project("py/project/z_order.py", (import_project) => {
        it("obeys z-order instructions", async () => {
            let project = await import_project();

            let assert_order_after_messages = (messages, exp_class_names) => {
                for (const message of messages) {
                    project.do_synthetic_broadcast(message);
                    project.one_frame();
                }

                // TODO: Can we get at DrawLayerGroup.SPRITES here, and
                // thereby avoid literal "1"?
                let got_instances = project.draw_layer_groups[1].instances;
                let got_class_names = got_instances.map(i => i.actor.class_name);
                assert.deepStrictEqual(got_class_names, exp_class_names);
            }

            assert_order_after_messages(["banana-front", "orange-front", "apple-front"],
                                        ["Pear", "Banana", "Orange", "Apple"]);

            assert_order_after_messages(["pear-forward-2"],
                                        ["Banana", "Orange", "Pear", "Apple"]);

            assert_order_after_messages(["pear-backward-1"],
                                        ["Banana", "Pear", "Orange", "Apple"]);

            assert_order_after_messages(["orange-back"],
                                        ["Orange", "Banana", "Pear", "Apple"]);

            assert_order_after_messages(["banana-back"],
                                        ["Banana", "Orange", "Pear", "Apple"]);

            assert_order_after_messages(["apple-back"],
                                        ["Apple", "Banana", "Orange", "Pear"]);

            assert_order_after_messages(["pear-backward-1"],
                                        ["Apple", "Banana", "Pear", "Orange"]);

            assert_order_after_messages(["pear-backward-1"],
                                        ["Apple", "Pear", "Banana", "Orange"]);

            assert_order_after_messages(["pear-forward-20"],
                                        ["Apple", "Banana", "Orange", "Pear"]);

            assert_order_after_messages(["pear-backward-10"],
                                        ["Pear", "Apple", "Banana", "Orange"]);
        });
    });
});

describe("z-order of clones with deletion", () => {
    with_project("py/project/z_order_with_cloning.py", (import_project) => {
        it("does not draw a deleted clone", async () => {
            let project = await import_project();

            project.do_synthetic_broadcast("init");
            project.one_frame();

            // Create 7 clones; each broadcast clones all existing instances.
            for (let i = 0; i != 3; ++i) {
                project.do_synthetic_broadcast("create-clone");
                // Allow the message-receiver to run, and the newly-created
                // clone to run also and get its id.
                many_frames(project, 2);
            }

            // TODO: In due course we will have a guarantee that clones appear
            // directly behind the instance they were cloned from.  When we have
            // that, test it.  Until then we have to ignore order when testing we
            // have the correct collection of bananas.
            //
            const assert_unordered_banana_ids = (exp_ids) => {
                let bananas = project.draw_layer_groups[1].instances;
                let got_ids = bananas.map(b => js_getattr(b.py_object, "id"));
                got_ids.sort((a, b) => (a - b));
                assert.deepStrictEqual(got_ids, exp_ids);
            }

            // At this point we should have the original plus 7 clones.
            assert_unordered_banana_ids(
                [1000, 1001, 1002, 1003, 1004, 1005, 1006, 1007]);

            // We request deletion of Banana 1003; it should then be gone from
            // the draw-list.
            project.do_synthetic_broadcast("delete-1003");
            project.one_frame();
            assert_unordered_banana_ids(
                [1000, 1001, 1002, /* no 1003 */ 1004, 1005, 1006, 1007]);

            // Red stop should delete all clones from the draw-list, leaving
            // just the original Banana 1000.
            project.on_red_stop_clicked();
            assert_unordered_banana_ids([1000]);
        });
    });
});

describe("clicking choose top sprite by z-order", () => {
    with_project("py/project/z_order_with_clicking.py", (import_project) => {
        it("gives click to front-layer sprite when overlap", async () => {
            let project = await import_project();

            const py_monitor = project.actor_by_class_name("Monitor").py_cls;
            const assert_clicks = (exp_clicks) => {
                const got_clicks = js_getattr(py_monitor, "clicks");
                assert.deepStrictEqual(got_clicks, exp_clicks);
            };

            const click = () => {
                mock_mouse.click_at(0, 0);
                project.one_frame();
            };

            const summon_to_front_and_click = (sprite_tag) => {
                project.do_synthetic_broadcast(`${sprite_tag}-front`);
                project.one_frame();
                click();
            };

            const hide_and_click = (sprite_tag) => {
                project.do_synthetic_broadcast(`${sprite_tag}-hide`);
                project.one_frame();
                click();
            };
        });
    });
});
