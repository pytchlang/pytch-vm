"use strict";

describe("moving ball example", () => {
    it("renders correctly", async () => {
        let import_result = await import_local_file("py/project/moving_ball.py");
        let project = import_result.$d.project.js_project;

        assert.equal(project.actors.length, 1);

        // Ball should go to (100, 50) but its costume has center
        // (8, 8) so, given different y sense of Stage and image,
        // it's rendered at (92, 58).
        assert_renders_as("start",
                          project,
                          [["RenderImage", 92, 58, 1, "yellow-ball"]]);

        // Set things going.
        project.on_green_flag_clicked();

        // On the next rendered frame, it should have moved right
        // by 50.
        project.one_frame();
        assert_renders_as("green-flag",
                          project,
                          [["RenderImage", 142, 58, 1, "yellow-ball"]]);

        // For 30 frames (the half-second sleep), it should not
        // move.  We have already done one of those 30, so for the
        // next 29 frames it should not move.
        for (let i = 0; i < 29; ++i) {
            project.one_frame();
            assert_renders_as(`frame-${i}`,
                              project,
                              [["RenderImage", 142, 58, 1, "yellow-ball"]]);
        }

        // And now it should move another 60.
        project.one_frame();
        assert_renders_as("frame-29",
                          project,
                          [["RenderImage", 202, 58, 1, "yellow-ball"]]);

        // Everything should have finished.
        assert.strictEqual(project.thread_groups.length, 0);
    });
});
