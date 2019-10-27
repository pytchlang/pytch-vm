var $builtinmodule = function (name) {
    let mod = {};

    const new_pytch_suspension = (subtype, data) => {
        let susp = new Sk.misceval.Suspension();
        susp.resume = () => Sk.builtin.none.none$;
        susp.data = { type: "Pytch", subtype: subtype, subtype_data: data };
        return susp;
    };

    mod.yield_until_next_frame = new Sk.builtin.func(() => {
        return new_pytch_suspension("next-frame", null);
    });

    mod.broadcast = new Sk.builtin.func(py_message => {
        let js_message = Sk.ffi.remapToJs(py_message);
        return new_pytch_suspension("broadcast", js_message);
    });

    mod.broadcast_and_wait = new Sk.builtin.func(py_message => {
        let js_message = Sk.ffi.remapToJs(py_message);
        return new_pytch_suspension("broadcast-and-wait", js_message);
    });

    return mod;
};
