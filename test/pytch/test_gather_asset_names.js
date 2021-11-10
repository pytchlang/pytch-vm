"use strict";

const {
    configure_mocha,
    deIndent,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Pre-loading a project to discover what assets it needs.

describe("asset detection", () => {
    it("extracts assets from project", async () => {
        const code = deIndent(`
            import pytch

            class Orb(pytch.Sprite):
                Costumes = ([("shiny", "shinyorb.png")]
                            + [f"frame-{i}.png" for i in range(4)])
                Sounds = ["ping.mp3", ("pong-sound", "pong.wav")]

            class Sky(pytch.Stage):
                Backdrops = ["starry-sky.jpg"]
        `);

        const extraction_result
              = await Sk.pytchsupport.asset_names_of_project(code);

        assert.equal(extraction_result.status, "ok");

        let got_assets = extraction_result.assets;
        got_assets.sort();

        assert.deepEqual(got_assets,
                         [
                             "frame-0.png",
                             "frame-1.png",
                             "frame-2.png",
                             "frame-3.png",
                             "ping.mp3",
                             "pong.wav",
                             "shinyorb.png",
                             "starry-sky.jpg",
                         ]);
    });

    it("copes with code having error", async () => {
        const code = deIndent(`
            import pytch

            class Banana(pytch.Sprite):
                Costumes = [f"{1/0}.png"]
        `);

        const extraction_result
              = await Sk.pytchsupport.asset_names_of_project(code);

        assert.equal(extraction_result.status, "error");
    })
});
