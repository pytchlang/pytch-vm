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

    [
	{ label: "instance", attr_owner: "self" },
	{ label: "class", attr_owner: "Alien" },
    ].forEach(spec =>
    it(`finds distance to mouse (${spec.label})`, async () => {
        const project = await import_deindented(`
            import pytch
            class Alien(pytch.Sprite):
                @pytch.when_I_receive("move")
                def move_elsewhere(self):
                    self.go_to_xy(100, 80)
                @pytch.when_I_receive("report")
                def report_mouse_props(self):
                    print(
                        f"{${spec.attr_owner}.distance_to_mouse:.0f}",
                        end="",
                    )
        `);

        function assert_state(exp_dist) {
            project.do_synthetic_broadcast("report");
            one_frame(project);
            const distance_str = pytch_stdout.drain_stdout();
            assert.equal(distance_str, Math.round(exp_dist).toString());
        }

        mock_mouse.move(0, 0);
        assert_state(0);

        mock_mouse.move(100, 0);
        assert_state(100);

        mock_mouse.move(100, 100);
        assert_state(141);

        mock_mouse.move(100, -200);
        assert_state(224);

        project.do_synthetic_broadcast("move");
        one_frame(project);
        assert_state(280);

        mock_mouse.move(0, 0);
        assert_state(128);
    }));

    it("detects touching mouse", async () => {
        const project = await import_deindented(`
            import pytch
            class Alien(pytch.Sprite):
                Costumes = [('square', 'square-80x80.png', 20, 30)]
                @pytch.when_I_receive("report")
                def report_mouse_props(self):
                    self.go_to_xy(100, -10)
                    print(self.touching_mouse, end="")
        `);

        // Including effect of go_to_xy(), the bounding box of the
        // sprite costume should be:
        //
        // Bottom-left: ( 80, -60)
        // Top-right:   (160,  20)

        function assert_state(x, y, exp_touching) {
            mock_mouse.move(x, y)
            project.do_synthetic_broadcast("report");
            one_frame(project);
            const got_touching_str = pytch_stdout.drain_stdout();
            const exp_touching_str = exp_touching ? "True" : "False";
            assert.equal(got_touching_str, exp_touching_str);
        }

	// A few points in the interior:
        assert_state(100, 0, true);
        assert_state(90, 10, true);
        assert_state(150, -50, true);

	// Around the bottom-left corner:
        assert_state(80, -60, true);
        assert_state(79, -60, false);
        assert_state(80, -61, false);

	// Around the top-left corner:
        assert_state(80, 20, true);
        assert_state(79, 20, false);
        assert_state(80, 21, false);

	// Around the top-right corner:
        assert_state(160, 20, true);
        assert_state(161, 20, false);
        assert_state(160, 21, false);

	// Around the bottom-right corner:
        assert_state(160, -60, true);
        assert_state(161, -60, false);
        assert_state(160, -61, false);
    });
});
