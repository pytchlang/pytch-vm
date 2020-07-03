"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    assert_renders_as,
    mock_keyboard,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////

describe("moving ball example", () => {
    const ball_at = (x, y) => [["RenderImage", x, y, 1, "yellow-ball"]];

    with_project("py/project/moving_ball.py", (import_project) => {
    it("renders correctly", async () => {
        let project = await import_project();

        assert.equal(project.actors.length, 1);

        // Ball should go to (100, 50) but its costume has center
        // (8, 8) so, given different y sense of Stage and image,
        // it's rendered at (92, 58).
        assert_renders_as("start", project, ball_at(92, 58));

        // Set things going.
        project.on_green_flag_clicked();

        // On the next rendered frame, it should have moved right
        // by 50.
        project.one_frame();
        assert_renders_as("green-flag", project, ball_at(142, 58));

        // For 30 frames (the half-second sleep), it should not
        // move.  We have already done one of those 30, so for the
        // next 29 frames it should not move.
        for (let i = 0; i < 29; ++i) {
            project.one_frame();
            assert_renders_as(`frame-${i}`, project, ball_at(142, 58));
        }

        // And now it should move another 60.
        project.one_frame();
        assert_renders_as("frame-29", project, ball_at(202, 58));

        // Everything should have finished.
        assert.strictEqual(project.thread_groups.length, 0);
    });

    it("responds to key presses", async () => {
        let project = await import_project();

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

    it("can tell which keys are pressed", async () => {
        let project = await import_project();
        let ball = project.instance_0_by_class_name("Ball");

        const assert_keys = (exp_keys => {
            project.do_synthetic_broadcast("check-keys");
            project.one_frame();
            assert.strictEqual(ball.js_attr("keys_pressed"), exp_keys);
        });

        assert_keys("");
        mock_keyboard.press_key("a");
        assert_keys("a");
        mock_keyboard.press_key("b");
        assert_keys("ab");
        mock_keyboard.release_key("a");
        assert_keys("b");
        mock_keyboard.press_key("c");
        assert_keys("bc");
        mock_keyboard.release_key("b");
        assert_keys("c");
        mock_keyboard.release_key("c");
        assert_keys("");
    })});
});
