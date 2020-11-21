"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    pytch_stdout,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Module-level constants

describe("Module-level constants", () => {
    it("provides fps, stage-wd, stage-ht", async () => {
        const project = await import_deindented(`
            import pytch
            class Banana(pytch.Sprite):
                Costumes = []
                @pytch.when_I_receive("run")
                def report_constants(self):
                    print(f"{pytch.FRAMES_PER_SECOND} fps;"
                          f" stage {pytch.STAGE_WIDTH}x{pytch.STAGE_HEIGHT}")
        `);

        project.do_synthetic_broadcast("run")
        one_frame(project);
        const stdout = pytch_stdout.drain_stdout();
        assert.equal(stdout, "60 fps; stage 480x360\n");
    });
});
