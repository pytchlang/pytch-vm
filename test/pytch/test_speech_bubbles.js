"use strict";

const {
    configure_mocha,
    with_project,
    import_deindented,
    assert,
    SpeechAssertions,
    many_frames,
    one_frame,
    assert_n_speaker_ids,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Speech bubbles

describe("Speech bubbles", () => {
    with_project("py/project/talking_banana.py", (import_project) => {
        it("includes speech-bubble instructions", async () => {
            const project = await import_project();

            const assert_speech = new SpeechAssertions(
                project,
                ["RenderImage", -40, 15, 1, "yellow-banana"]
            );

            assert_speech.is("startup", true, []);

            // The effects of the say() and say_nothing() methods should persist
            // until changed, so run for a few frames after each one.

            project.do_synthetic_broadcast("talk")
            for (let i = 0; i < 10; ++i) {
                one_frame(project);
                assert_speech.is("after-talk", true, [["Hello world", 0, 15]]);
            }

            project.do_synthetic_broadcast("silence")
            for (let i = 0; i < 10; ++i) {
                one_frame(project);
                assert_speech.is("after-silence", true, []);
            }

            // But say_for_seconds(), with seconds = 0.5, should give exactly 30
            // frames of speech.

            project.do_synthetic_broadcast("talk-briefly")
            for (let i = 0; i < 30; ++i) {
                one_frame(project);
                assert_speech.is("after-talk-briefly", true, [["Mumble", 0, 15]]);
            }
            for (let i = 0; i < 30; ++i) {
                one_frame(project);
                assert_speech.is("after-talk-briefly", true, []);
            }
        });

        it("handles overlapping say-for-seconds calls", async () => {
            const project = await import_project();
            const assert_speech = new SpeechAssertions(
                project,
                ["RenderImage", -40, 15, 1, "yellow-banana"]
            );

            assert_speech.is("startup", true, []);

            // Launch a half-second speech.
            project.do_synthetic_broadcast("talk-briefly");
            one_frame(project);
            assert_speech.is("after-talk-briefly", true, [["Mumble", 0, 15]]);

            // Launch the longer speech; it should replace the "Mumble".
            project.do_synthetic_broadcast("say-goodbye");
            one_frame(project);
            assert_speech.is("immed-after-say-goodbye", true, [["Bye!", 0, 15]]);

            // The "Bye!" should persist for a whole second.  (We've already
            // spend a frame in the previous check.)
            many_frames(project, 59);
            assert_speech.is("1s-after-say-goodbye", true, [["Bye!", 0, 15]]);

            // And then go away.
            one_frame(project);
            assert_speech.is("said-goodbye", true, []);
        });
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
        const assert_speech = new SpeechAssertions(
            project,
            ["RenderImage", 0, 35, 1, "yellow-banana"]
        );
        assert_speech.is("startup", true, [["Hello world", 40, 35]]);
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
