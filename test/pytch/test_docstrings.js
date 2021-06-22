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
        { objName: "pytch.wait_seconds", expRegex: /number of seconds/ },
        { objName: "pytch.Sprite.x_position", expRegex: /x-coord.*stage/ },
        { objName: "pytch.Stage.switch_backdrop", expRegex: /Switch .* BACKDROP/ },
        { objName: "pytch.Sprite.all_clones", expRegex: /all clones of/ },
    ].forEach(spec =>
        it(`provides docstring for ${spec.objName}`, async () => {
            const project = await import_deindented(`

                import pytch

                class Banana(pytch.Sprite):
                    Costumes = []

                    @pytch.when_I_receive("run")
                    def emit_docstring(self):
                        print(${spec.objName}.__doc__)
            `);

            project.do_synthetic_broadcast("run");
            one_frame(project);

            const stdout = pytch_stdout.drain_stdout();
            assert.match(stdout, spec.expRegex);
        })
    );
});
