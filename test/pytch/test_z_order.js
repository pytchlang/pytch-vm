"use strict";

const {
    configure_mocha,
    with_project,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Z-Order operations

describe("z-order operations", () => {
    with_project("py/project/z_order.py", (import_project) => {
        it("obeys z-order instructions", async () => {
            let project = await import_project();
        });
    });
});
