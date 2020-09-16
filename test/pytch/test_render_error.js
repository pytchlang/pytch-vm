"use strict";

const {
    configure_mocha,
    with_project,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Errors raised while rendering.  You have to try moderately hard to cause
// such an error, but we want to handle it gracefully.

describe("rendering error-handler", () => {
    with_project("py/project/render_error.py", (import_project) => {
        it("passes error to callback", async () => {
            const project = await import_project();
        });
    });
});
