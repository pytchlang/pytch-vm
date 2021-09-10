"use strict";

const {
    configure_mocha,
    import_deindented,
    pytch_stdout,
    assert,
    assert_float_close,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////

describe("Glide easing", () => {
    // For "linear", we're only really testing that we've successfully
    // exposed the JavaScript function to Python.  For "ease-in-out",
    // we are also checking the algebra in going from the form given
    // here in the test to the one used in the module.
    [
        {
            easingName: "linear",
            exp_t_fun: t => t,
        },
        {
            easingName: "ease-in-out",
            exp_t_fun: t => ((t < 0.5)
                             ? (2.0 * t * t)
                             : (1.0 - 0.5 * (-2 * t + 2) * (-2 * t + 2))),
        },
    ].forEach(spec => {
        it(`computes ${spec.easingName}`, async () => {
            const project = await import_deindented(`

                import pytch
                import pytch._glide_easing

                cv = pytch._glide_easing.named["${spec.easingName}"]
                print([cv(t / 22.0) for t in range(0, 23)])
            `);

            const got_ts = JSON.parse(pytch_stdout.drain_stdout());
            assert.strictEqual(got_ts.length, 23);

            got_ts.forEach((got_t, idx) => {
                const exp_t = spec.exp_t_fun(idx / 22.0);
                assert_float_close(got_t, exp_t, 1.0e-15);
            });
        });
    });
});
