"use strict";

const {
    configure_mocha,
    import_deindented,
    pytch_stdout,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Inline Python and stdout capturing

describe("Inline Python with stdout capturing", () => {
    it("captures output from print", async () => {
        const project = await import_deindented(`

            import pytch
            print("Hello world")
        `);

        const stdout = pytch_stdout.drain_stdout();
        assert.equal(stdout, "Hello world\n");
    });
});
