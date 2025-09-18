"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    assert,
    mock_mouse,
    pytch_stdout,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////

describe("mouse features", () => {
    it("reads x/y/down properties", async () => {
        const project = await import_deindented(`
            import pytch
            class Alien(pytch.Sprite):
                @pytch.when_I_receive("report")
                def report_mouse_props(self):
                    print(
                        f"{self.mouse_x:.0f}",
                        f"{self.mouse_y:.0f}",
                        self.mouse_down,
                        sep=" ",
                        end="",
                    )
        `);

        function assert_state(exp_x, exp_y, exp_down) {
            project.do_synthetic_broadcast("report");
            one_frame(project);
            const output = pytch_stdout.drain_stdout();
            const [x_str, y_str, down_str] = output.split(" ");
            assert.deepStrictEqual(
                [x_str, y_str, down_str],
                [
                    exp_x.toString(),
                    exp_y.toString(),
                    exp_down ? "True" : "False",
                ]
            );
        }

        mock_mouse.move(12, -99);
        assert_state(12, -99, false);
        mock_mouse.button_down();
        assert_state(12, -99, true);
        mock_mouse.move(23, 42);
        assert_state(23, 42, true);
        mock_mouse.button_up();
        assert_state(23, 42, false);
        mock_mouse.click_at(100, 150);
        assert_state(100, 150, false);
    });
});
