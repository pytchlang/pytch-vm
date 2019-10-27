"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.project'

describe("pytch.project module", () => {
    it("can be imported", () => {
        let import_result = import_local_file("py/project/just_import.py");
        assert.ok(import_result.$d.pytch_project);
    });
});
