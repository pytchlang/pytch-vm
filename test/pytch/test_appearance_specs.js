"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assert_Appearance_equal,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Different ways of specifying a Costume or Backdrop

describe("Costume spec parsing", () => {
    const test_cases = [
        {
            label: "full four-component",
            fragment: '("yellow", "yellow-banana.png", 25, 20)',
            exp_info: [
                "yellow",
                "yellow-banana.png",
                80, 30,
                25, 20,
            ],
        },
        {
            label: "label and filename; infer centre",
            fragment: '("yellow", "yellow-banana.png")',
            exp_info: [
                "yellow",
                "yellow-banana.png",
                80, 30,
                40, 15,
            ],
        },
        {
            label: "filename and centre; infer label",
            fragment: '("yellow-banana.png", 11, 12)',
            exp_info: [
                "yellow-banana",
                "yellow-banana.png",
                80, 30,
                11, 12,
            ],
        },
        {
            label: "filename as 1-elt tuple; infer label and centre",
            fragment: '("yellow-banana.png",)',
            exp_info: [
                "yellow-banana",
                "yellow-banana.png",
                80, 30,
                40, 15,
            ],
        },
        {
            label: "filename as bare string; infer label and centre",
            fragment: '"yellow-banana.png"',
            exp_info: [
                "yellow-banana",
                "yellow-banana.png",
                80, 30,
                40, 15,
            ],
        },
    ];

    test_cases.forEach(spec => {
    it(`parses spec (${spec.label}) correctly`, async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                Costumes = [${spec.fragment}]
        `);

        const banana = project.actor_by_class_name("Banana");
        const appearances = banana._appearances;
        assert.equal(appearances.length, 1);
        assert_Appearance_equal(appearances[0], ...spec.exp_info);
    });
    });
});

describe("Backdrop spec parsing", () => {
    const test_cases = [
        {
            label: "full two-component",
            fragment: '("timber", "wooden-stage.png")',
            exp_info: [
                "timber",
                "wooden-stage.png",
            ],
        },
        {
            label: "filename as 1-elt tuple; infer label",
            fragment: '("wooden-stage.png",)',
            exp_info: [
                "wooden-stage",
                "wooden-stage.png",
            ],
        },
        {
            label: "filename as bare string; infer label",
            fragment: '"wooden-stage.png"',
            exp_info: [
                "wooden-stage",
                "wooden-stage.png",
            ],
        },
    ];

    test_cases.forEach(spec => {
    it(`parses spec (${spec.label}) correctly`, async () => {
        const project = await import_deindented(`

            import pytch
            class MyStage(pytch.Stage):
                Backdrops = [${spec.fragment}]
        `);

        const stage = project.actor_by_class_name("MyStage");
        const appearances = stage._appearances;
        assert.equal(appearances.length, 1);

        // All stages should be 480x360 with centre (240, 180).
        const full_spec = [...spec.exp_info, 480, 360, 240, 180];

        assert_Appearance_equal(appearances[0], ...full_spec);
    });
    });
});
