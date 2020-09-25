"use strict";

const {
    configure_mocha,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Different ways of specifying a Costume or Backdrop

describe("Costume spec parsing", () => {
    const test_cases = [
        {
            label: "full four-component",
            fragment: '("yellow", "library/images/yellow-banana.png", 25, 20)',
            exp_info: [
                "yellow",
                "project-assets/library/images/yellow-banana.png",
                80, 30,
                25, 20,
            ],
        },
    ];
});
