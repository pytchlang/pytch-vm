"use strict";

const {
    configure_mocha,
    import_deindented,
    assert_renders_as,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Speech bubbles

describe("Speech bubbles", () => {
    it("includes speech-bubble instructions", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]

                @pytch.when_I_receive("talk")
                def talk(self):
                    self.say("Hello world")

                @pytch.when_I_receive("silence")
                def fall_silent(self):
                    self.say_nothing()

                @pytch.when_I_receive("talk-briefly")
                def talk_briefly(self):
                    self.say_for_seconds("Mumble", 0.5)
        `);

        const exp_speech = (content, tip_x, tip_y) =>
              ["RenderSpeechBubble", content, tip_x, tip_y];

        const assert_speech = (label, exp_speech_instructions) => {
            assert_renders_as(
                label,
                project,
                [
                    ["RenderImage", -40, 15, 1, "yellow-banana"],
                    ...exp_speech_instructions,
                ]
            );
        };

        assert_speech("startup", []);

        // The effects of the say() and say_nothing() methods should persist
        // until changed, so run for a few frames after each one.

        project.do_synthetic_broadcast("talk")
        for (let i = 0; i < 10; ++i) {
            project.one_frame()
            assert_speech("after-talk", [exp_speech("Hello world", 0, 15)]);
        }

        project.do_synthetic_broadcast("silence")
        for (let i = 0; i < 10; ++i) {
            project.one_frame()
            assert_speech("after-silence", []);
        }

        // But say_for_seconds(), with seconds = 0.5, should give exactly 30
        // frames of speech.

        project.do_synthetic_broadcast("talk-briefly")
        for (let i = 0; i < 30; ++i) {
            project.one_frame()
            assert_speech("after-talk-briefly", [exp_speech("Mumble", 0, 15)]);
        }
        for (let i = 0; i < 30; ++i) {
            project.one_frame()
            assert_speech("after-talk-briefly", []);
        }
    });

    it("moves speech-bubble with sprite", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]

                @pytch.when_I_receive("move-and-talk")
                def move_and_talk(self):
                    self.go_to_xy(40, 20)
                    self.say("Hello world")
        `);

        project.do_synthetic_broadcast("move-and-talk");
        project.one_frame();
        assert_renders_as(
            "startup",
            project,
            [
                ["RenderImage", 0, 35, 1, "yellow-banana"],
                ["RenderSpeechBubble", "Hello world", 40, 35],
            ]
        );
    });
});
