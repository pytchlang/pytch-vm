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

    it("responds to key presses", async () => {
        let import_result = await import_local_file("py/project/moving_ball.py");
        let project = import_result.$d.project.js_project;

        const ball_at = (x, y) => [["RenderImage", x, y, 1, "yellow-ball"]];
        assert_renders_as("start", project, ball_at(92, 58));

        mock_keyboard.press_key('w')
        project.one_frame()
        assert_renders_as("frame-1", project, ball_at(92, 68));

        // Key 'w' is still down, but it is not freshly pressed, so
        // nothing should change.
        project.one_frame()
        assert_renders_as("frame-2", project, ball_at(92, 68));

        // Release 'w'.
        mock_keyboard.release_key('w')

        // If someone is quick enough to type more than one key, they all
        // take effect.
        mock_keyboard.press_key('w')
        mock_keyboard.release_key('w')
        mock_keyboard.press_key('w')
        mock_keyboard.release_key('w')
        mock_keyboard.press_key('s')
        mock_keyboard.release_key('s')
        project.one_frame()
        assert_renders_as("frame-3", project, ball_at(92, 68 + 10 + 10 - 100));
    });
});
