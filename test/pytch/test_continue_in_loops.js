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
// Use of "continue" in for and while loops

describe("Use of 'continue' in loops", () => {
    const method_using_for = `# Use 'for'
                    @pytch.when_I_receive("count")
                    def count(self):
                        self.n = 0
                        for i in range(10):
                            self.n += 1
                            continue
                            self.n += 1000  # Should not happen
    `;

    const method_using_while = `# Use 'while'
                    @pytch.when_I_receive("count")
                    def count(self):
                        self.n = 0
                        i = 0
                        while i < 10:
                            i += 1
                            self.n += 1
                            continue
                            self.n += 1000  # Should not happen
    `;

    [
        { label: 'for loop', method_code: method_using_for },
        { label: 'while loop', method_code: method_using_while },
    ].forEach(spec =>
        it(`yields when loop does 'continue' (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Costumes = []

                    ${spec.method_code}
            `);

            const banana_0 = project.instance_0_by_class_name("Banana");
            const current_n = () => js_getattr(banana_0.py_object, "n");

            project.do_synthetic_broadcast("count");
            for (let i = 0; i < 10; ++i) {
                one_frame(project);
                assert.strictEqual(current_n(), i + 1);
            }
        })
    );
});
