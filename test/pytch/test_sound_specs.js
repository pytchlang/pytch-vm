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
});
