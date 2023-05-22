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
    pytch_errors,
    pytch_stdout,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Speech bubbles

describe("Speech bubbles", () => {
    with_project("py/project/talking_banana.py", (import_project) => {
        const make_SpeechAssertions = (project) => new SpeechAssertions(
            project,
            ["RenderImage", 0, 0, 1, "yellow-banana"]
        );

        it("includes speech-bubble instructions", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);

            assert_speech.is("startup", true, []);

            // The effects of the say() method should persist until changed, so
            // run for a few frames after each one.

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

            // Nothing further should happen; ensure output correct.
            many_frames(project, 60);
            assert.strictEqual(pytch_stdout.drain_stdout(), "/mumble\n");
        });

        it("handles overlapping say-for-seconds calls", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);

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

            // Nothing further should happen; ensure output correct.
            many_frames(project, 60);
            assert.strictEqual(pytch_stdout.drain_stdout(), "/mumble\n");
        });

        // Not really 'cancelled' because we explicitly say-nothing, but
        // we want to test this situation is handled by say_for_seconds().
        it("handles 'cancelled' say-for-seconds call", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);

            // Launch a half-second speech.
            project.do_synthetic_broadcast("talk-briefly");
            one_frame(project);
            assert_speech.is("after-talk-briefly", true, [["Mumble", 0, 15]]);

            // Quickly silence the banana.
            project.do_synthetic_broadcast("silence");
            one_frame(project);
            assert_speech.is("after-silence", true, []);

            // Nothing bad should happen if we run for another second;
            // check output.
            many_frames(project, 60);
            assert.strictEqual(pytch_stdout.drain_stdout(), "/mumble\n");
        });

        it("hides/shows speech bubble with sprite", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);
            const exp_speech_instrn = ["Hello world", 0, 15];

            assert_speech.is("startup", true, []);

            project.do_synthetic_broadcast("talk")
            many_frames(project, 5);
            assert_speech.is("after-talk", true, [exp_speech_instrn]);

            project.do_synthetic_broadcast("hide")
            many_frames(project, 5);
            assert_speech.is("after-hide", false, []);

            project.do_synthetic_broadcast("show")
            many_frames(project, 5);
            assert_speech.is("after-show", true, [exp_speech_instrn]);
        });

        it("handles empty string for say_for_seconds", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);

            // Launch chat and check first bubble.
            project.do_synthetic_broadcast("silence-for-seconds");
            one_frame(project);
            assert_speech.is("after-silence", true, []);

        });

        it("handles chat with silence say_for_seconds", async () => {
            const project = await import_project();
            const assert_speech = make_SpeechAssertions(project);

            // Launch chat and check first bubble.
            project.do_synthetic_broadcast("chat");
            many_frames(project, 5);
            assert_speech.is("after-talk", true, [["Hello!", 0, 15]]);

            //5+116 = one frame after say for seconds "" empty runned
            many_frames(project, 116);
            assert_speech.is("after-silence", true, []);

            many_frames(project, 60);
            assert_speech.is("after-bye", true, [["OK bye", 0, 15]]);

        });
    });

    [
        {
            label: "red-stop",
            action: (project) => project.on_red_stop_clicked(),
        },
        {
            label: "stop-all",
            action: (project) => project.do_synthetic_broadcast("halt"),
        },
    ].forEach(spec =>
        it(`clears speech bubbles (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Costumes = ["yellow-banana.png"]
                    @pytch.when_I_receive("talk")
                    def talk(self):
                        self.say("Hello world")
                    @pytch.when_I_receive("halt")
                    def stop_everything(self):
                        pytch.stop_all()
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

            spec.action(project);
            one_frame(project);
            assert_bubble_contents([]);
        }));

    it("moves speech-bubble with sprite", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]

                @pytch.when_I_receive("move-and-talk")
                def move_and_talk(self):
                    self.go_to_xy(40, 20)
                    self.say(42.25)
        `);

        project.do_synthetic_broadcast("move-and-talk");
        one_frame(project);
        const assert_speech = new SpeechAssertions(
            project,
            ["RenderImage", 40, 20, 1, "yellow-banana"]
        );
        assert_speech.is("startup", true, [["42.25", 40, 35]]);
    });

    it("rejects non-string non-number speech text", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]

                @pytch.when_I_receive("try-talk")
                def bad_talk(self):
                    self.say(lambda x: x)
        `);

        project.do_synthetic_broadcast("try-talk");
        one_frame(project);
        pytch_errors.assert_sole_error_matches(/must be a string or number/);
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

    it("rejects non-numeric duration argument", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
              Costumes = ["yellow-banana.png"]

              @pytch.when_I_receive("try-say")
              def bad_say_seconds(self):
                self.say_for_seconds("hello", "three")
        `);

        project.do_synthetic_broadcast("try-say");
        one_frame(project);
        pytch_errors.assert_sole_error_matches(/must be a number/);
    });
});
