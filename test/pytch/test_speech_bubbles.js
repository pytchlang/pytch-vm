"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assert_renders_as,
    many_frames,
    one_frame,
    assert_n_speaker_ids,
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
            one_frame(project);
            assert_speech("after-talk", [exp_speech("Hello world", 0, 15)]);
        }

        project.do_synthetic_broadcast("silence")
        for (let i = 0; i < 10; ++i) {
            one_frame(project);
            assert_speech("after-silence", []);
        }

        // But say_for_seconds(), with seconds = 0.5, should give exactly 30
        // frames of speech.

        project.do_synthetic_broadcast("talk-briefly")
        for (let i = 0; i < 30; ++i) {
            one_frame(project);
            assert_speech("after-talk-briefly", [exp_speech("Mumble", 0, 15)]);
        }
        for (let i = 0; i < 30; ++i) {
            one_frame(project);
            assert_speech("after-talk-briefly", []);
        }
    });

    it("clears speech bubbles on red-stop", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]
                @pytch.when_I_receive("talk")
                def talk(self):
                    self.say("Hello world")
        `);

        const assert_bubble_contents = (exp_bubbles) => {
            const got_instructions = project.rendering_instructions();
            const got_bubbles = got_instructions.filter(
                i => i.kind === "RenderSpeechBubble"
            ).map(
                i => i.content
            );
            got_bubbles.sort();
            assert.deepStrictEqual(got_bubbles, exp_bubbles);
        };

        project.do_synthetic_broadcast("talk");
        one_frame(project);
        assert_bubble_contents(["Hello world"]);

        project.on_red_stop_clicked();
        one_frame(project);
        assert_bubble_contents([]);
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
        one_frame(project);
        assert_renders_as(
            "startup",
            project,
            [
                ["RenderImage", 0, 35, 1, "yellow-banana"],
                ["RenderSpeechBubble", "Hello world", 40, 35],
            ]
        );
    });

    it("identifies the speaker of each bubble", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
              Costumes = ["yellow-banana.png"]

              @pytch.when_I_receive("clone")
              def spawn_another(self):
                self.go_to_xy(-100, 0)
                self.say("I am the original")
                pytch.create_clone_of(self)

              @pytch.when_I_start_as_a_clone
              def become_clone(self):
                self.go_to_xy(100, 0)
                self.say("I am the only clone")
        `);

        project.do_synthetic_broadcast("clone");

        // Allow spawn_another() to run and then also become_clone():
        many_frames(project, 2);

        assert_n_speaker_ids(project, 2);
    });
});
