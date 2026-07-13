"use strict";

const {
    configure_mocha,
    broadcast_and_step,
    import_deindented,
    pytch_errors,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Attempted assignment to, e.g., Banana.size should raise an error.

describe("assignment to class attribute", () => {
    [
        "Actor.sound_volume",
        "Sprite.x_position",
        "Sprite.y_position",
        "Sprite.direction",
        "Sprite.size",
        "Sprite.costume_number",
        "Sprite.costume_name",
        "Sprite.distance_to_mouse",
        "Sprite.touching_mouse",
        "Stage.backdrop_number",
        "Stage.backdrop_name",
    ].forEach(propQName => {
        const [cls, attr] = propQName.split(".");
        it(`gives error trying to set ${propQName}`, async () => {
            const project = await import_deindented(`

                import pytch

                class Background(pytch.Stage):
                    Backdrops = ["wooden-stage.png"]

                class Banana(pytch.Sprite):
                    Costumes = ["balloon.png"]

                class Writer(pytch.Sprite):
                    @pytch.when_I_receive("bad-set-sprite")
                    def bad_set_sprite(self):
                        # Value doesn't matter:
                        Banana.${attr} = 42

                    @pytch.when_I_receive("bad-set-stage")
                    def bad_set_stage(self):
                        # Value doesn't matter:
                        Background.${attr} = 42
                `);

            const assert_error_on_assign = (msg_suffix, cls_name) => {
                broadcast_and_step(project, `bad-set-${msg_suffix}`);
                pytch_errors.assert_sole_error_matches(
                    new RegExp(
                        `property '${attr}' of '${cls_name}'.*not on the class`
                    )
                );
            };

            if (["Sprite", "Actor"].includes(cls))
                assert_error_on_assign("sprite", "Banana");

            if (["Stage", "Actor"].includes(cls))
                assert_error_on_assign("stage", "Background");
        });
    });
});
