"use strict";

const {
    configure_mocha,
    import_deindented,
    assert_float_close,
    assert_renders_as,
    one_frame,
    mock_mouse,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Sprite rotation

describe("Sprite rotation", () => {
    const assert_Banana_direction = (project, msg, exp_direction) => {
	project.do_synthetic_broadcast(msg)
	one_frame(project);

        const banana = project.instance_0_by_class_name("Banana");
	const got_direction = banana.js_attr("direction");
	assert_float_close(got_direction, exp_direction, 0.0001);
    };

    it("can turn and point", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
                @pytch.when_I_receive("turn")
                def turn(self):
                    self.turn_degrees(41)
                @pytch.when_I_receive("point")
                def point(self):
                    self.point_degrees(102)
        `);

        assert_Banana_direction(project, "turn", 41);
        assert_Banana_direction(project, "turn", 82);
        assert_Banana_direction(project, "point", 102);
        assert_Banana_direction(project, "turn", 143);

        // Check all new parts of the rendering instruction:
        //     rotation, image-cx, image-cy
        assert_renders_as(
            "final",
            project,
            [["RenderImage", 0, 0, 1, "yellow-banana", 143, 40, 15]]
        );
    });

    it("can point to the mouse", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
                @pytch.when_I_receive("point")
                def point(self):
                    self.point_towards_mouse()
        `);

	function move_mouse_assert_direction(x, y, exp_dir) {
            mock_mouse.move(x, y);
            assert_Banana_direction(project, "point", exp_dir);
	}

        move_mouse_assert_direction(100, 0, 0);
        move_mouse_assert_direction(0, 100, 90);
        move_mouse_assert_direction(100, -100, -45);
        move_mouse_assert_direction(-100, -100, -135);
    });
});
