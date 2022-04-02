"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    assert,
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
});
