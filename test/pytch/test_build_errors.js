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
    with_project("py/project/no_import_pytch.py", (import_project) => {
        it("raises error if no import pytch", async () => {
            // The import_project function returns a promise, so we
            // can directly use it as the first arg to assert.rejects().
            await assert.rejects(
                import_project(),
                (err) => {
                    assertBuildError(err, "import", /^SyntaxError.*import pytch/);
                    return true;
                }
            );
        });
    });
});
