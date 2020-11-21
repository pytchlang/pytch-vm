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
        // The calculations involve (1/60) so won't come out exact.  Round
        // the got positions to the nearest multiple of (1/2^16).
        const round = (x) => (Math.round(x * 65536) / 65536);

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


