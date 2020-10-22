var $builtinmodule = function (name) {
    let mod = {};

    const new_pytch_suspension = (syscall_name, syscall_args) => {
        let susp = new Sk.misceval.Suspension();
        susp.resume = () => Sk.builtin.none.none$;
        susp.data = { type: "Pytch",
                      subtype: syscall_name,
                      subtype_data: syscall_args };
        return susp;
    };

    mod.yield_until_next_frame = new Sk.builtin.func(() => {
        // Handle case of no executing Pytch Thread, which happens if we're
        // called at the top level of a module.  Be a no-op in this case.
        if (Sk.pytch.executing_thread == null)
            return Sk.builtin.none.none$;

        return new_pytch_suspension("next-frame", {});
    });

    const broadcast_maybe_wait = (py_message, wait) => {
        let message = Sk.ffi.remapToJs(py_message);
        return new_pytch_suspension("broadcast", {message, wait});
    };

    mod.broadcast = new Sk.builtin.func(
        py_message => broadcast_maybe_wait(py_message, false));

    mod.broadcast_and_wait = new Sk.builtin.func(
        py_message => broadcast_maybe_wait(py_message, true));

    mod.play_sound = new Sk.builtin.func((py_obj, py_sound_name, py_wait) => {
        let sound_name = Sk.ffi.remapToJs(py_sound_name);
        let wait = Sk.ffi.remapToJs(py_wait);
        return new_pytch_suspension("play-sound", {py_obj, sound_name, wait});
    });

    mod.stop_all_sounds = new Sk.builtin.func(() => {
        Sk.pytch.sound_manager.stop_all_performances();
        return Sk.builtin.none.none$;
    });

    mod.wait_seconds = new Sk.builtin.func(py_n_seconds => {
        let n_seconds = Sk.ffi.remapToJs(py_n_seconds);
        return new_pytch_suspension("wait-seconds", {n_seconds});
    });

    mod.register_sprite_instance = new Sk.builtin.func(py_instance => {
        return new_pytch_suspension("register-instance", {py_instance});
    });

    mod.registered_instances = new Sk.builtin.func(py_class => {
        let actor = py_class.$pytchActor;
        let py_instances = actor.instances.map(instance => instance.py_object);
        return new Sk.builtin.list(py_instances);
    });

    mod.key_is_pressed = new Sk.builtin.func((py_keyname) => {
        let js_keyname = Sk.ffi.remapToJs(py_keyname);
        return (Sk.pytch.keyboard.key_is_pressed(js_keyname)
                ? Sk.builtin.bool.true$
                : Sk.builtin.bool.false$);
    });

    return mod;
};
