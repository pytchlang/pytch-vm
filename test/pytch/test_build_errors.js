"use strict";

const {
    configure_mocha,
    with_project,
    assert,
} = require("./pytch-testing.js");
configure_mocha();

////////////////////////////////////////////////////////////////////////////////
//
// Build-error handling.

const assertBuildError = (err, exp_phase, innerMsgRegExp) => {
    const msg = Sk.builtin.str(err).v;
    assert.ok(
        /^PytchBuildError/.test(msg),
        `did not get PytchBuildError: ${msg}`
    );
    assert.equal(err.phase, exp_phase);

    if (innerMsgRegExp != null) {
        const innerMsg = Sk.builtin.str(err.innerError).v;
        assert.ok(
            innerMsgRegExp.test(innerMsg),
            (`innerError message "${innerMsg}"`
             + ` did not match /${innerMsgRegExp.source}/`)
        );
    }
};

describe("build-error handling", () => {
});
