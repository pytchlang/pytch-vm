"use strict";

const {
    configure_mocha,
    import_deindented,
    js_getattr,
    assert,
    assert_renders_as,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Automatic switch_costume() and show() if Sprite has at least one Costume

describe("Automatic switch-costume/show", () => {
    it("starts off showing a Sprite with Costume", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
        `);

        const banana_0 = project.instance_0_by_class_name("Banana");
        const shown = js_getattr(banana_0.py_object, "_shown");
        assert.equal(shown, true);

        // Costume is 80 x 30 so with the auto-centre behaviour and y-flip, we
        // expect the rendering at (-40, 15).
        assert_renders_as("startup", project,
                          [["RenderImage", -40, 15, 1, "yellow-banana"]]);
    });

    it("starts off not showing a Sprite with no Costume", async () => {
        const project = await import_deindented(`

            import pytch
            class Monitor(pytch.Sprite):
                Costumes = []
        `);

        const monitor_0 = project.instance_0_by_class_name("Monitor");
        const shown = js_getattr(monitor_0.py_object, "_shown");
        assert.equal(shown, false);

        assert_renders_as("startup", project, []);
    });
});
