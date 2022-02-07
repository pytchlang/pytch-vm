"use strict";

const {
    configure_mocha,
    assert,
    import_deindented,
    one_frame,
    many_frames,
    pytch_stdout,
    assertLiveQuestion,
    assertNoLiveQuestion,
    pytch_errors,
    SpeechAssertions,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Text input mechanism via "ask and wait for answer"

describe("Ask and wait for answer", () => {
    it("can ask a single question", async () => {
        const project = await import_deindented(`

            import pytch
            class Interviewer(pytch.Sprite):
                @pytch.when_I_receive("ask")
                def ask_name_and_age(self):
                    name = pytch.ask_and_wait("name?")
                    print(f"Hello {name}!")
                    age = pytch.ask_and_wait("age?")
                    print(f"Ha ha {age} is very old!")
        `);

        // Initially there should be no question being asked.
        many_frames(project, 5);
        assertNoLiveQuestion(project);

        // Question should immediately be asked; execution should be blocked in
        // the first ask/answer, meaning nothing has been printed yet.
        project.do_synthetic_broadcast("ask");
        one_frame(project);
        assertLiveQuestion(project, "name?");
        assert.equal(pytch_stdout.drain_stdout(), "");

        // If the user does nothing for a bit, the above claims should both
        // still hold.
        many_frames(project, 5);
        assertLiveQuestion(project, "name?");
        assert.equal(pytch_stdout.drain_stdout(), "");

        // The proper API is to be given the info on the live question from
        // project.one_frame(), so do that here rather than using the
        // render-checking one_frame() function.
        let { maybe_live_question: live_question_0 } = project.one_frame();

        // When the user answers, that should unblock the thread.  We should see
        // the first bit of output and a new live question.
        project.accept_question_answer(live_question_0.id, "Ben");
        one_frame(project);
        assert.equal(pytch_stdout.drain_stdout(), "Hello Ben!\n");
        assertLiveQuestion(project, "age?");

        // If the user does nothing for a bit, then nothing further should be
        // printed, and the live question should still be "age?"
        many_frames(project, 5);
        assertLiveQuestion(project, "age?");
        assert.equal(pytch_stdout.drain_stdout(), "");

        // When we answer that question, we should see the new output,
        // and that should be the end of the questioning.
        let { maybe_live_question: live_question_1 } = project.one_frame();
        project.accept_question_answer(live_question_1.id, "47");
        one_frame(project);
        assert.equal(pytch_stdout.drain_stdout(), "Ha ha 47 is very old!\n");
        assertNoLiveQuestion(project);
    });

    it("queues near-simultaneous questions", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
                Costumes = []  # Invisible, so prompt is in question itself
                @pytch.when_I_receive("banana-ask")
                def ask_name(self):
                    name = self.ask_and_wait("name?")
                    print(f"Hello {name}!")

            class Pear(pytch.Sprite):
                Costumes = []
                @pytch.when_I_receive("pear-ask")
                def ask_age(self):
                    age = self.ask_and_wait("age?")
                    print(f"You are {age}")
        `);

        // Initially there should be no question being asked.
        many_frames(project, 5);
        assertNoLiveQuestion(project);

        // Launch the banana question; should be asked immediately.
        project.do_synthetic_broadcast("banana-ask")
        one_frame(project);
        assertLiveQuestion(project, "name?");

        // Launch the pear question; should be queued behind still-active banana
        // question, blocking the Pear's thread and so giving no new output.
        project.do_synthetic_broadcast("pear-ask")
        many_frames(project, 5);
        assertLiveQuestion(project, "name?");
        assert.equal(pytch_stdout.drain_stdout(), "");

        // Answer the banana's question; should immediately see the output and
        // the pear's question.
        let { maybe_live_question: live_question_0 } = project.one_frame();
        project.accept_question_answer(live_question_0.id, "Ben");
        one_frame(project);
        assert.equal(pytch_stdout.drain_stdout(), "Hello Ben!\n");
        assertLiveQuestion(project, "age?");

        // Answer the pear's question; should see the output and no further
        // question.
        let { maybe_live_question: live_question_1 } = project.one_frame();
        project.accept_question_answer(live_question_1.id, "47");
        one_frame(project);
        assert.equal(pytch_stdout.drain_stdout(), "You are 47\n");
        assertNoLiveQuestion(project);
    });

    [
        { tag: "float", message: "banana-ask" },
        { tag: "int", message: "pear-ask" },
        { tag: "lambda", message: "bowl-ask" },
    ].forEach(spec =>
        it(`rejects non-string questions (${spec.tag})`, async () => {
            const project = await import_deindented(`

                import pytch

                class Banana(pytch.Sprite):
                    @pytch.when_I_receive("banana-ask")
                    def ask_name(self):
                        self.ask_and_wait(3.14)

                class Pear(pytch.Sprite):
                    @pytch.when_I_receive("pear-ask")
                    def ask_name(self):
                        pytch.ask_and_wait(99)

                class FruitBowl(pytch.Stage):
                    @pytch.when_I_receive("bowl-ask")
                    def ask_name(self):
                        self.ask_and_wait(lambda x: 42)
            `);

            project.do_synthetic_broadcast(spec.message);
            one_frame(project);

            pytch_errors.assert_sole_error_matches(/question must be a string/);
        })
    );

    it("chooses bubble or prompt correctly", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
                Costumes = ["yellow-banana.png"]

                @pytch.when_I_receive("ask-hidden")
                def ask_hidden(self):
                    self.hide()
                    self.ask_and_wait("name?")

                @pytch.when_I_receive("ask-shown")
                def ask_shown(self):
                    self.show()
                    self.ask_and_wait("age?")
        `);

        const assert_speech = new SpeechAssertions(
            project,
            ["RenderImage", 0, 0, 1, "yellow-banana"]
        );

        assert_speech.is("startup", true, []);

        // Asking a question when hidden should put the prompt into the question
        // itself, so no speech bubble should happen.
        project.do_synthetic_broadcast("ask-hidden");
        one_frame(project);
        assert_speech.is("asking-hidden", false, []);
        assertLiveQuestion(project, "name?");

        let { maybe_live_question: live_question } = project.one_frame();
        project.accept_question_answer(live_question.id, "Ben");
        one_frame(project);

        // Asking a question when shown should put the prompt into a speech
        // bubble on the Sprite asking the question, with the question itself
        // having no prompt.
        project.do_synthetic_broadcast("ask-shown");
        one_frame(project);
        assert_speech.is("asking-hidden", true, [["age?", 0, 15]]);
        assertLiveQuestion(project, null);

        // Don't bother answering the second question.
    });

    [
        {
            label: "red-stop",
            action: (project) => project.on_red_stop_clicked(),
        },
    ].forEach(spec =>
        it(`abandons questions on ${spec.label}`, async () => {
            const project = await import_deindented(`

                import pytch
                class Interviewer(pytch.Sprite):
                    @pytch.when_I_receive("ask")
                    def ask_name(self):
                        name = pytch.ask_and_wait("name?")
            `);

            project.do_synthetic_broadcast("ask");
            one_frame(project);
            assertLiveQuestion(project, "name?");

            spec.action(project);
            one_frame(project);
            assertNoLiveQuestion(project);
        }));

});
