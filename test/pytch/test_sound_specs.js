"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assertBuildErrorFun,
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

    const bad_cases = [
        {
            label: "0-length tuple",
            fragment: 'tuple()',
            error_regexp: /1 or 2 elements/,
        },
        {
            label: "3-length tuple",
            fragment: '(1, 2, 3)',
            error_regexp: /1 or 2 elements/,
        },
        {
            label: "number",
            fragment: '42',
            error_regexp: /tuple or string/,
        },
        {
            label: "label non-string",
            fragment: '(42, "shriek.mp3")',
            error_regexp: /label \(first.*of two.*\) must be a string/,
        },
        {
            label: "filename of 2-elt tuple non-string",
            fragment: '("shriek", 3.141)',
            error_regexp: /filename \(second.*of two.*\) must be a string/,
        },
        {
            label: "filename of 1-elt tuple non-string",
            fragment: '(3.141,)',
            error_regexp: /filename \(sole.*of one.*\) must be a string/,
        },
    ];

    bad_cases.forEach(spec => {
    it(`rejects spec (${spec.label})`, async () => {
        await assert.rejects(
            import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Sounds = [${spec.fragment}]
            `),
            assertBuildErrorFun("register-actor", spec.error_regexp));
    });
    });
});
