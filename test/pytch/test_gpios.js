"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    many_frames,
    async_many_frames,
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
        const project = await import_deindented(set_output_code);

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

        const project = await import_deindented(set_output_code);

        project.do_synthetic_broadcast("set");
        many_frames(project, 5);
        pytch_errors.assert_sole_error_matches(/set-output.*GPIO reset failed/);
    });

    [
        { tag: "self-check of test", pin: 150, expectError: false, assertFun: (n) => (n === 10) },
        { tag: "bad pin", pin: 180, expectError: true, assertFun: (n) => (n > 0 && n < 10) },
    ].forEach(spec => {
        it(`gives error for bad set-output pin (${spec.tag})`, async () => {
            const project = await import_deindented(`

                import pytch

                class WritePins(pytch.Sprite):
                    @pytch.when_I_receive("drive")
                    def configure_pins(self):
                        pytch.set_gpio_output(${spec.pin}, 1);
                        while True:
                            print("hello")
            `);

            project.do_synthetic_broadcast("drive");
            many_frames(project, 10);

            if (spec.expectError) {
                const rich_err = pytch_errors.sole_error();
                assert.strictEqual(rich_err.ctx.kind, "delayed_gpio");
                assert.match(rich_err.err.toString(), /pin 180 cannot be an output/);
            }

            const stdout = pytch_stdout.drain_stdout();
            const n_stdout_lines = stdout.trim().split("\n").length;
            assert.ok(spec.assertFun(n_stdout_lines));
        });
    });

    it("can set pin as input", async () => {
        const project = await import_deindented(`

            import pytch

            class ReadPins(pytch.Sprite):
                @pytch.when_I_receive("configure")
                def configure_pins(self):
                    pytch.set_gpio_as_input(110, "pull-up");
                    print("done 110")
                    pytch.set_gpio_as_input(111, "pull-down");
                    print("done 111")
                    pytch.set_gpio_as_input(112, "no-pull");
                    print("done 112")
                    pytch.wait_seconds(0)  # Ensure next output new frame
                    v = pytch.get_gpio_value(110)
                    print(f"pin 110 is {v}")
        `);

        project.do_synthetic_broadcast("configure");
        pytch_stdout.poll_for_matching(project, /done 110/);
        pytch_stdout.poll_for_matching(project, /done 111/);
        pytch_stdout.poll_for_matching(project, /done 112/);
        pytch_stdout.poll_for_matching(project, /pin 110 is 0/);
    });

    it("can read input pin", async () => {
        const project = await import_deindented(`

            import pytch

            class ReadPins(pytch.Sprite):
                @pytch.when_I_receive("configure")
                def configure_pin(self):
                    pytch.set_gpio_as_input(110, "pull-up");
                @pytch.when_I_receive("read")
                def read_pin(self):
                    val = pytch.get_gpio_value(110)
                    print(f"val {val}")
        `);

        project.do_synthetic_broadcast("configure");
        many_frames(project, 5);
        for (let i = 0; i !== 5; ++i) {
            project.do_synthetic_broadcast("read");
            many_frames(project, 5);
        }
        mock_gpio_api.drive_pin(110, 1);
        for (let i = 0; i !== 5; ++i) {
            project.do_synthetic_broadcast("read");
            many_frames(project, 5);
        }

        // The first batch of five "read"s should all print "val 0".
        // Although we then drive the pin high, the message takes a
        // few frames (set by "report_input_delay" in mock_gpio_api)
        // to be handled by the Project, so the first of the second
        // batch of "read"s should also print "val 0".  The remaining
        // four "read"s of the second batch should then print "val 1".
        assert.strictEqual(
            pytch_stdout.drain_stdout(),
            "val 0\n".repeat(6) + "val 1\n".repeat(4)
        );
    });

    it("gives error for bad set-input pin", async () => {
        const project = await import_deindented(`

            import pytch

            class ReadPins(pytch.Sprite):
                @pytch.when_I_receive("configure")
                def configure_pins(self):
                    pytch.set_gpio_as_input(150, "pull-up");
        `);

        project.do_synthetic_broadcast("configure");
        many_frames(project, 10);
        pytch_errors.assert_sole_error_matches(/pin 150 cannot be/);
    });

    it("get-value gives error for non-input pin", async () => {
        const project = await import_deindented(`

            import pytch

            class ReadPins(pytch.Sprite):
                @pytch.when_I_receive("read")
                def configure_pins(self):
                    pytch.get_gpio_value(110)
        `);

        project.do_synthetic_broadcast("read");
        many_frames(project, 10);
        pytch_errors.assert_sole_error_matches(/pin 110 has not been set/);
    });
});

describe("GPIO WebSocket", () => {
    const ws = require("ws");

    it("works", async () => {
        Sk.pytch.gpio_api = Sk.pytchsupport.WebSocket_GpioApi(ws, "ws://localhost:8055/");

        const project = await import_deindented(`

            import pytch

            class ReadPins(pytch.Sprite):
                @pytch.when_I_receive("read")
                def configure_pins(self):
                    pytch.set_gpio_as_input(4, "pull-up")
                    pin4 = pytch.get_gpio_value(4)
                    print(f"read {pin4}")
                @pytch.when_I_receive("drive")
                def drive_pin(self):
                    pin4 = pytch.get_gpio_value(4)
                    print(f"read {pin4}")
                    pytch.set_gpio_output(5, 0);
                    while True:
                        pin4 = pytch.get_gpio_value(4)
                        if pin4 == 0:
                            break;
                    print("read 0")
                    pytch.set_gpio_output(5, 1);
                    while True:
                        pin4 = pytch.get_gpio_value(4)
                        if pin4 == 1:
                            break;
                    print("read 1")
        `);

        project.do_synthetic_broadcast("read");
        await async_many_frames(project);
        assert.strictEqual(pytch_stdout.drain_stdout().trim(), "read 1");

        project.do_synthetic_broadcast("drive");
        await async_many_frames(project);
        assert.strictEqual(pytch_stdout.drain_stdout().trim(), "read 1\nread 0\nread 1");
    });
});
