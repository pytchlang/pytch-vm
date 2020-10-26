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
// Python 3 features

describe("support for Python 3", () => {
    it("can work with f-strings", async () => {
        const project = await import_deindented(`

            import pytch
            greeting = "Hello"

            # Error under Python 2:
            print(f"{greeting} world")
        `);

        const stdout = pytch_stdout.drain_stdout();
        assert.equal(stdout, "Hello world\n");
    });

    it("has print() as a function", async () => {
        const project = await import_deindented(`

            import pytch

            # Emits ('Hello', 'world') under Python 2:
            print("Hello", "world")
        `);

        const stdout = pytch_stdout.drain_stdout();
        assert.equal(stdout, "Hello world\n");
    });
});
