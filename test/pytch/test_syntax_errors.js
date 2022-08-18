"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assertTigerPythonAnalysis,
    assertBuildErrorFun,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////

describe("Syntax errors", () => {
    it("identifies multiple syntax errors", async () => {
        const do_import = import_deindented(`
            import pytch
            class Apple(pytch.Sprite):
                def peel(self):
                    for x in range
                    foo = bar(]
        `);

        await assert.rejects(
            do_import,
            assertTigerPythonAnalysis([
                { re: /colon .* is required/, line: 3 },
                { re: /body .* missing/, line: 3 },
                { re: /mismatched bracket/, line: 4 },
            ])
        );
    });

    it("gives Skulpt error for double-f prefix", async () => {
        // My quick bodge-fix to TigerPython to allow it to handle
        // f-strings lets a double-f prefix slip through.  Check that
        // we at least get Skulpt's error in this situation.

        const do_import = import_deindented(`
            import pytch
            class Apple(pytch.Sprite):
                def peel(self):
                    x = ff"hello bad string prefix"
        `);

        const assertDetails = assertBuildErrorFun(
            "import",
            Sk.builtin.SyntaxError,
            /bad input/);

        await assert.rejects(do_import, assertDetails);
    });
});
