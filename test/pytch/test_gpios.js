"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    many_frames,
    assert,
    mock_gpio_api,
    pytch_stdout,
    pytch_errors,
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

    beforeEach(() => {
        mock_gpio_api.set_reset_response({ kind: "success", delay: 0 });
    });

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

    it("notes failure if response too slow", async () => {
        mock_gpio_api.set_reset_response({ kind: "no-response" });

        const project = await import_deindented("\nimport pytch\n");

        many_frames(project, 50);
        assert.strictEqual(project.gpio_reset_state.status, "failed");
        assert.strictEqual(project.gpio_reset_state.failureKind, "timeout");
    });

    it("notes failure on error response", async () => {
        mock_gpio_api.set_reset_response({ kind: "failure", delay: 3 });

        const project = await import_deindented("\nimport pytch\n");

        many_frames(project, 50);
        const reset_state = project.gpio_reset_state;
        assert.strictEqual(reset_state.status, "failed");
        assert.strictEqual(reset_state.failureKind, "error-response");
        assert.strictEqual(reset_state.errorDetail, "marzlevanes misaligned");
    });

    const set_output_code = `
        import pytch
        class Driver(pytch.Sprite):
            @pytch.when_I_receive("set")
            def set_pin(self):
                pytch.set_gpio_output(1, 1);
    `;

    it("can set output pin to value", async () => {
        const project = await import_deindented(`

            import pytch
            class Driver(pytch.Sprite):
                @pytch.when_I_receive("set")
                def set_pin(self):
                    pytch.set_gpio_output(1, 1);
        `);

        project.do_synthetic_broadcast("set");
        many_frames(project, 5);

        const pin_1 = mock_gpio_api.pin_state(1)
        assert.strictEqual(pin_1.kind, "out")
        assert.strictEqual(pin_1.level, 1);

        // TODO: Cleaner way to examine state of gpio command queue?
        assert.strictEqual(project.gpio_command_queue.commands_awaiting_response.size, 0);
    });

    it("raises exception on set_gpio_output if reset failed", async () => {
        mock_gpio_api.set_reset_response({ kind: "failure", delay: 3 });

        const project = await import_deindented(`

            import pytch
            class Driver(pytch.Sprite):
                @pytch.when_I_receive("set")
                def set_pin(self):
                    pytch.set_gpio_output(1, 1);
        `);

        project.do_synthetic_broadcast("set");
        many_frames(project, 5);
        pytch_errors.assert_sole_error_matches(/set-output.*GPIO reset failed/);
    });
});
