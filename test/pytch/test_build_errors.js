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

const assertBuildErrorFun = (...args) => {
    return (err) => {
        assertBuildError(err, ...args);
        return true;
    };
};

describe("build-error handling", () => {
    with_project("py/project/no_import_pytch.py", (import_project) => {
        it("raises error if no import pytch", async () => {
            // The import_project function returns a promise, so we
            // can directly use it as the first arg to assert.rejects().
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("import", /^SyntaxError.*import pytch/)
            );
        });
    });

    with_project("py/project/bad_costume_for_auto_configure.py", (import_project) => {
        it("raises error if missing costume", async () => {
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("register-actor",
                                    /^PytchAssetLoadError.*angry-alien/)
            );
        });
    });

    with_project("py/project/bad_project_class.py", (import_project) => {
        it("raises error from instantiating Project", async () => {
            await assert.rejects(
                import_project(),
                assertBuildErrorFun("create-project")
            );
        });
    });

    with_project("py/project/bad_actor_init.py", (import_project) => {
        it("raises error from instantiating sprite", async () => {
            await assert.rejects(
                import_project(),
                (err) => {
                    assertBuildError(err, "register-actor");
                    assert.equal(err.phaseDetail.kind, "Sprite");
                    assert.equal(err.phaseDetail.className, "Problem");
                    return true;
                }
            );
        });
    });
});
