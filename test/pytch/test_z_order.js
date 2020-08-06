"use strict";

const {
    configure_mocha,
    with_project,
    assert,
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
        });
    });
});
