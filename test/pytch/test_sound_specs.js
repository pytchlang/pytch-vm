"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Different ways of specifying a Sound

describe("Sound spec parsing", () => {
    const good_cases = [
        {
            label: "full two-component",
            fragment: '("toot", "trumpet.mp3")',
            exp_info: ["toot", "trumpet.mp3"],
        },
        {
            label: "filename as 1-elt tuple; infer label",
            fragment: '("trumpet.mp3",)',
            exp_info: ["trumpet", "trumpet.mp3"],
        },
        {
            label: "filename as bare string; infer label",
            fragment: '"trumpet.mp3"',
            exp_info: ["trumpet", "trumpet.mp3"],
        },
    ];

    good_cases.forEach(spec => {
    it(`parses spec (${spec.label}) correctly`, async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Sounds = [${spec.fragment}]
        `);

        const banana = project.actor_by_class_name("Banana");
        const sounds = banana._sounds;
        assert.equal(sounds.length, 1);
        assert.equal(sounds[0][1].tag, spec.exp_info[0]);
        assert.equal(sounds[0][1].filename, spec.exp_info[1]);
    });
    });
});
