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
    it("computes linear", async () => {
        const project = await import_deindented(`

            import pytch
            import pytch._glide_easing

            cv = pytch._glide_easing.named["linear"]
            print([cv(t / 22.0) for t in range(0, 23)])
        `);

        const got_ts = JSON.parse(pytch_stdout.drain_stdout());
        assert.strictEqual(got_ts.length, 23);
        got_ts.forEach((got_t, idx) => {
            const exp_t = idx / 22.0;
            assert_float_close(got_t, exp_t, 1.0e-15);
        });
    });
});
