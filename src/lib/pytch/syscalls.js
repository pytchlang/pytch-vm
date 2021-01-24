var $builtinmodule = function (name) {
    let mod = {};

    const skulpt_function = Sk.pytchsupport.skulpt_function;

    const new_pytch_suspension = (syscall_name, syscall_args) => {
        let susp = new Sk.misceval.Suspension();

        susp.data = {
            type: "Pytch",
            subtype: syscall_name,
            subtype_data: syscall_args,
            result: {  // Default is for a syscall to return None
                kind: "success",
                value: Sk.builtin.none.none$,
            },
        };

        susp.resume = () => {
            const result = susp.data.result;

            switch (result.kind) {
            case "success":
                return result.value;
            case "failure":
                throw result.error;
            default:
                throw Error("unknown result-kind");
            }
        };

        return susp;
    };

    mod.yield_until_next_frame = skulpt_function(
        () => {
            const executing_thread = Sk.pytch.executing_thread;

            // Handle case of no executing Pytch Thread, which happens if we're
            // called at the top level of a module.  Be a no-op in this case.
            if (executing_thread == null)
                return Sk.builtin.none.none$;

            return (executing_thread.should_yield()
                    ? new_pytch_suspension("next-frame", {})
                    : Sk.builtin.none.none$);
        },
        `-- TODO: Docstring --`,
    );

    mod.push_loop_iterations_per_frame = skulpt_function(
        (py_iterations_per_frame) => {
            const thread = Sk.pytch.executing_thread;
            if (thread == null)
                throw new Sk.builtin.RuntimeError(
                    "cannot push loop-iterations-per-frame outside a Thread");

            thread.push_loop_iterations_per_frame(py_iterations_per_frame.v);
        },
        `-- TODO: Docstring --`,
    );

    mod.pop_loop_iterations_per_frame = skulpt_function(
        () => {
            const thread = Sk.pytch.executing_thread;
            if (thread == null)
                throw new Sk.builtin.RuntimeError(
                    "cannot pop loop-iterations-per-frame outside a Thread");

            thread.pop_loop_iterations_per_frame();
        },
        `-- TODO: Docstring --`,
    );

    const broadcast_maybe_wait = (py_message, wait) => {
        let message = Sk.ffi.remapToJs(py_message);
        return new_pytch_suspension("broadcast", {message, wait});
    };

    mod.broadcast = skulpt_function(
        (py_message) => broadcast_maybe_wait(py_message, false),
        `-- TODO: Docstring --`,
    );

    mod.broadcast_and_wait = skulpt_function(
        (py_message) => broadcast_maybe_wait(py_message, true),
        `-- TODO: Docstring --`,
    );

    mod.play_sound = skulpt_function(
        (py_obj, py_sound_name, py_wait) => {
            let sound_name = Sk.ffi.remapToJs(py_sound_name);
            if (typeof sound_name !== "string")
                throw new Sk.builtin.TypeError(
                    "play_sound() must be given a string");

            let wait = Sk.ffi.remapToJs(py_wait);
            return new_pytch_suspension("play-sound", {py_obj, sound_name, wait});
        },
        `-- TODO: Docstring --`,
    );

    mod.stop_all_sounds = skulpt_function(
        () => {
            Sk.pytch.sound_manager.stop_all_performances();
            return Sk.builtin.none.none$;
        },
        `-- TODO: Docstring --`,
    );

    mod.wait_seconds = skulpt_function(
        (py_n_seconds) => {
            let n_seconds = Sk.ffi.remapToJs(py_n_seconds);
            return new_pytch_suspension("wait-seconds", {n_seconds});
        },
        `-- TODO: Docstring --`,
    );

    // TODO: Allow None as py_parent_instance, to register an instance
    // which was not created by Pytch's clone mechanism?
    mod.register_sprite_instance = skulpt_function(
        (py_instance, py_parent_instance) => {
            return new_pytch_suspension("register-instance",
                                        {py_instance, py_parent_instance});
        },
        `-- TODO: Docstring --`,
    );

    mod.registered_instances = skulpt_function(
        (py_class) => {
            let actor = py_class.$pytchActor;
            let py_instances = actor.instances.map(instance => instance.py_object);
            return new Sk.builtin.list(py_instances);
        },
        `-- TODO: Docstring --`,
    );

    mod.key_is_pressed = skulpt_function(
        (py_keyname) => {
            let js_keyname = Sk.ffi.remapToJs(py_keyname);
            return (Sk.pytch.keyboard.key_is_pressed(js_keyname)
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$);
        },
        `-- TODO: Docstring --`,
    );

    return mod;
};
