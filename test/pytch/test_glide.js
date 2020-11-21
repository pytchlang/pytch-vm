"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Glide block

describe("Behaviour of glide-to method", () => {
    it("executes glide", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
                @pytch.when_I_receive("run")
                def slide_across_screen(self):
                    self.go_to_xy(-120, -120)
                    self.glide_to_xy(0, 120, 1.0)
        `);
    });
});


