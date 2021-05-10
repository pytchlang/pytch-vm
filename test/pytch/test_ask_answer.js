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
                    name = pytch.ask_and_wait_for_answer("name?")
                    print(f"Hello {name}!")
                    age = pytch.ask_and_wait_for_answer("age?")
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
});
