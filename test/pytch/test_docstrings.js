"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    pytch_stdout,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Docstrings

describe("Docstrings", () => {
    [
        { clsName: "pytch", attrName: "wait_seconds", expRegex: /number of seconds/ },
        { clsName: "pytch.Sprite", attrName: "x_position", expRegex: /x-coord.*stage/ },
        { clsName: "pytch.Stage", attrName: "switch_backdrop", expRegex: /Switch .* BACKDROP/ },
        { clsName: "pytch.Sprite", attrName: "all_clones", expRegex: /all clones of/ },
    ].forEach(spec =>
        it(`provides docstring for ${spec.objName}`, async () => {
	    // The Python code uses __dict__ rather than the usual
	    // attribute access to handle the attributes which have
	    // "delegate to the original" behaviour.  For these
	    // particular properties, we don't have to also check the
	    // base class.  We would have to do more work to test
	    // "sound_volume".
            const project = await import_deindented(`

                import pytch

                class Banana(pytch.Sprite):
                    Costumes = []

                    @pytch.when_I_receive("run")
                    def emit_docstring(self):
                        print(${spec.clsName}.__dict__['${spec.attrName}'].__doc__)
            `);

            project.do_synthetic_broadcast("run");
            one_frame(project);

            const stdout = pytch_stdout.drain_stdout();
            assert.match(stdout, spec.expRegex);
        })
    );
});
