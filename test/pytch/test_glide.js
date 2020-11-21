"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    assert,
    pytch_errors,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Glide block

describe("Behaviour of glide-to method", () => {
    [
        { label: "float", fragment: "1.0" },
        { label: "int", fragment: "1" },
    ].forEach(spec => {
        it(`executes glide (${spec.label})`, async () => {
            // The calculations involve (1/60) so won't come out exact.  Round
            // the got positions to the nearest multiple of (1/2^16).
            const round = (x) => (Math.round(x * 65536) / 65536);

            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Costumes = ["yellow-banana.png"]
                    @pytch.when_I_receive("run")
                    def slide_across_screen(self):
                        self.go_to_xy(-120, -120)
                        self.glide_to_xy(0, 120, ${spec.fragment})
            `);

            let banana = project.instance_0_by_class_name("Banana");

            project.do_synthetic_broadcast("run");
            let got_positions = [];
            let exp_positions = [];
            for (let i = 0; i < 60; ++i) {
                one_frame(project);
                got_positions.push([round(banana.js_attr("_x")),
                                    round(banana.js_attr("_y"))]);

                // The banana must take 60 frames to perform a displacement of
                // (120, 240), and so should take a step of (2, 4) per frame.
                exp_positions.push([-120 + (i + 1) * 2, -120 + (i + 1) * 4]);
            }

            assert.deepStrictEqual(got_positions, exp_positions);
        });
    });

    [
        // TODO: Specs with properties "label", "fragment", "err_match".
    ].forEach(spec => {
        it(`handles bad input (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    Costumes = ["yellow-banana.png"]
                    @pytch.when_I_receive("run")
                    def slide_across_screen(self):
                        self.go_to_xy(-120, -120)
                        self.glide_to_xy(${spec.fragment})
            `);

            project.do_synthetic_broadcast("run");
            one_frame(project);

            const err_str = pytch_errors.sole_error_string();
            assert.match(err_str, spec.err_match);
        });
    });
});


