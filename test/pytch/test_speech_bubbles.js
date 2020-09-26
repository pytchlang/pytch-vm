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
    });
});
