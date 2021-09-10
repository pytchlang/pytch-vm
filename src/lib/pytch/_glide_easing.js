const $builtinmodule = function (name) {
    let glide_easing = {};

    // TODO: Type checking on inputs?

    const _linear = new Sk.builtin.func((t) => t);

    const _ease_in_out = new Sk.builtin.func((t) => {
        // We could perhaps accept integers etc. too, but the only
        // real use case is for floats in [0.0, 1.0], so may as well
        // avoid having to do things like convert BigInt to float.
        if (!Sk.builtin.checkFloat(t))
            throw new Sk.builtin.ValueError("input must be float");

        const t0 = t.v;
        const t0_sq = t0 * t0;

        const t_out = (
            (t0 < 0.5)
                ? (2.0 * t0_sq)
                : (-2.0 * t0_sq + 4 * t0 - 1)
        );
        return new Sk.builtin.float_(t_out);
    });

    const _str = (v) => new Sk.builtin.str(v);

    glide_easing.named = new Sk.builtin.dict([
        _str("linear"), _linear,
        _str("ease-in-out"), _ease_in_out,
    ]);

    return glide_easing;
};
