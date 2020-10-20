"use strict";

const {
    configure_mocha,
    import_deindented,
    js_getattr,
    one_frame,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Use of 'for' and 'while' loops at top level of module

describe("Use of for/while loops at module top-level", () => {
    const for_loop_code = `# Use for loop
                for i in range(5):
                    global_x += i
    `;

    const while_loop_code = `# Use while loop
                i = 0
                while i < 5:
                    global_x += i
                    i += 1
    `;

    const loop_test_specs = [
        { label: 'for loop', code: for_loop_code },
        { label: 'while loop', code: while_loop_code },
    ];

});
