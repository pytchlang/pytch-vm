"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assertSyntaxError,
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
                { re: /colon .* is required/, line: 4, offset: 22 },
                { re: /body .* missing/, line: 4, offset: 22 },
                { re: /mismatched bracket/, line: 5, offset: 18 },
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

    [
        {
            label: "TigerPython",
            disableTigerPython: false,
            validationFun: assertTigerPythonAnalysis([
                               { re: /extra symbol/, line: 5, offset: 4 },
                           ]),
        },
        {
            label: "Skulpt",
            disableTigerPython: true,
            validationFun: (e) => assertSyntaxError(
                                      e.innerError,
                                      0,
                                      { re: /bad input/, line: 5, offset: 4 }
                                  ),
        },
    ].forEach(spec => {
        it("raises SyntaxError with correct indexing (TigerPython)", async () => {
            // Lines should be numbered from 1, offset is measured
            // from 0.  So program text below has an error at location
            // as follows:
            //
            //     1 |# line 1
            //     2 |import pytch
            //     3 |
            //     4 |if True:
            //     5 |    <
            //            |
            //       |01234

            const import_project = import_deindented(`
                # line 1
                import pytch

                if True:
                    <
            `);

            Sk.pytch._disable_TigerPython = spec.disableTigerPython;
            await assert.rejects(import_project, spec.validationFun);
            Sk.pytch._disable_TigerPython = false;
        });
    });
});
