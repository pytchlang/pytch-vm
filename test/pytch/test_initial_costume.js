"use strict";

const {
    configure_mocha,
    import_deindented,
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

        // Costume is 80 x 30 so with the auto-centre behaviour and y-flip, we
        // expect the rendering at (-40, 15).
        assert_renders_as("startup", project,
                          [["RenderImage", -40, 15, 1, "yellow-banana"]]);
    });
});
