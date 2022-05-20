"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////

const assertTigerPythonAnalysis = (expErrors) => (err) => {
    assert.ok(err instanceof Sk.pytchsupport.PytchBuildError);
    assert.equal(err.phase, "import");
    assert.equal(err.innerError.tp$name, "TigerPythonSyntaxAnalysis");

    const got_errors = err.innerError.syntax_errors;

    assert.equal(
        got_errors.length,
        expErrors.length,
        `expecting ${expErrors.length} error/s but got ${got_errors.length}`
    );

    expErrors.forEach((expErr, i) => {
        const gotErr = got_errors[i];

        // The string ": expected" in message confuses Mocha; replace colons.
        const got_message = gotErr.args.v[0].v.replace(/:/g, "[COLON]");
        assert.ok(
            expErr.re.test(got_message),
            `error[${i}]'s message "${got_message}" did not match /${expErr.re.source}/`
        );

        const got_line = gotErr.traceback[0].lineno;
        assert.equal(
            got_line,
            expErr.line,
            `expecting error[${i}] ("${got_message}") to be reported`
                + ` on line ${expErr.line} but got ${gotErr.line}`
        );
    });

    return true;
}

describe("Syntax errors", () => {
});
