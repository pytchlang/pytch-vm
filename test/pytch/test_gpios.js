"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    many_frames,
    assert,
    mock_gpio_api,
    pytch_stdout,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// GPIOs

describe("GPIO interaction", () => {
    // No explicit test for "zero-delay success leaves all behaviour
    // alone" because all existing tests pass, which they wouldn't
    // with a delay, given that several tests make precise assertions
    // about what happens at each frame.

    [0, 2].forEach((delay) => {
        it(`delays real start until reset success (delay ${delay})`, async () => {
            mock_gpio_api.set_reset_response({ kind: "success", delay });

            const project = await import_deindented(`

                import pytch

                class Talker(pytch.Sprite):
                    @pytch.when_I_receive("talk")
                    def talk(self):
                        while True:
                            print("hi")
            `);

            project.do_synthetic_broadcast("talk");
            many_frames(project, 5);

            const got_stdout = pytch_stdout.drain_stdout()
            const exp_stdout = "hi\n".repeat(5 - delay);
            assert.strictEqual(got_stdout, exp_stdout);
        });
    });
});
