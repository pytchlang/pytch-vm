"use strict";

const {
    configure_mocha,
    import_deindented,
    assert,
    assertBuildErrorFun,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Trying to access a property through the class before the magic
// original-instance exists should raise an error.

describe("delegated properties without instance-0", () => {
    it("raises error", async () => {
        const do_import = import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
                pass

            print(Banana.x_position)
            `);

        const assertDetails = assertBuildErrorFun(
            "import",
            Sk.builtin.RuntimeError,
            /class 'Banana' has no original instance/
        );

        await assert.rejects(do_import, assertDetails);
    });
});
