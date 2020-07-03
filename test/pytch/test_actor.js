"use strict";

const {
    configure_mocha,
    with_module,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.actor'

describe("pytch.actor module", () => {
    with_module("py/actor/just_import.py", (import_module) => {
    it("can be imported", async () => {
        let import_result = await import_module();
        assert.ok(import_result.$d.Sprite);
        assert.ok(import_result.$d.Stage);
    })});
});
