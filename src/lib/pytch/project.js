var $builtinmodule = function (name) {
    let mod = {};

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Constants, convenience utilities

    const skulpt_function = Sk.pytchsupport.skulpt_function;

    const FRAMES_PER_SECOND = 60;
    const STAGE_WIDTH = 480;
    const STAGE_HEIGHT = 360;

    const s_pytch_handler_for = new Sk.builtin.str("_pytch_handler_for");
    const s_Costumes = new Sk.builtin.str("Costumes");
    const s_Backdrops = new Sk.builtin.str("Backdrops");
    const s_Sounds = new Sk.builtin.str("Sounds");
    const s_shown = new Sk.builtin.str("_shown");
    const s_x = new Sk.builtin.str("_x");
    const s_y = new Sk.builtin.str("_y");
    const s_size = new Sk.builtin.str("_size");
    const s_rotation = new Sk.builtin.str("_rotation");
    const s_appearance_index = new Sk.builtin.str("_appearance_index");
    const s_Appearances = new Sk.builtin.str("_Appearances");
    const s_speech = new Sk.builtin.str("_speech");
    const s_clear_speech = new Sk.builtin.str("_clear_speech");

    const s_pytch_parent_project = new Sk.builtin.str("_pytch_parent_project");

    // Attributes of Python-side Appearance object:
    const s_Label = new Sk.builtin.str("label");
    const s_Filename = new Sk.builtin.str("filename");
    const s_Size = new Sk.builtin.str("size");
    const s_Centre = new Sk.builtin.str("centre");

    const name_of_py_class
          = (py_cls =>
             Sk.ffi.remapToJs(Sk.builtin.getattr(py_cls, Sk.builtin.str.$name)));

    const js_hasattr = (py_obj, py_attr_name) => (
        (Sk.builtin.hasattr(py_obj, py_attr_name) === Sk.builtin.bool.true$));

    const try_py_getattr = (py_obj, py_attr_name) => (
        (js_hasattr(py_obj, py_attr_name)
         ? [true, Sk.builtin.getattr(py_obj, py_attr_name)]
         : [false, null]));

    const js_getattr = (py_obj, py_attr_name) => (
        Sk.ffi.remapToJs(Sk.builtin.getattr(py_obj, py_attr_name)));

    /** Get attribute value as JavaScript object, requiring that it be
      * an Array.  This means the underlying Python attribute value
      * must be a list or tuple.
      */
    const js_get_Array_attr = (py_obj, py_attr_name) => {
        const val = js_getattr(py_obj, py_attr_name);

        // The error message here is a bit of a lie; we will also
        // accept a Python tuple.
        if (!(val instanceof Array))
            throw new Sk.builtin.ValueError(
                `${py_attr_name.v} must be a list`);

        return val;
    };

    const path_stem = (path) => {
        const pieces = path.split("/");
        const basename = pieces[pieces.length - 1];
        const components = basename.split(".");
        const n_components = components.length;
        const n_keep = (n_components == 1) ? 1 : (n_components - 1);
        return components.slice(0, n_keep).join(".");
    }

    const map_concat
          = (fun, xs) => Array.prototype.concat.apply([], xs.map(fun));

    const next_global_id = (() => {
        let id = 1000;
        return () => {
            id += 1;
            return id;
        }
    })();

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Appearance: A Sprite has Costumes; a Stage has Backdrops.  Refer to one
    // of either of these things as an "Appearance".

    class Appearance {
        constructor(label, filename, image, centre_x, centre_y) {
            this.label = label;
            this.filename = filename;
            this.image = image;
            this.centre_x = centre_x;
            this.centre_y = centre_y;
        }

        get centre() {
            return [this.centre_x, this.centre_y];
        }

        get size() {
            return [this.image.width, this.image.height];
        }

        static async async_create(label, filename, centre_x, centre_y) {
            let image = await Sk.pytch.async_load_image(filename);

            if (centre_x == "auto" && centre_y == "auto") {
                centre_x = image.width / 2;
                centre_y = image.height / 2;
            }

            return new Appearance(label, filename, image, centre_x, centre_y);
        }
    }

    // Not sure this is the best way of doing this.  In some ways, it would be
    // cleaner to keep the JS-side object as the only source of truth, and
    // create Python-side strings, integers, etc., on demand when the
    // Python-side attribute is accessed.  Setting the attributes once-off like
    // this should be OK because the attributes on the JS side do not change
    // once created.

    // Do-nothing wrapper around object to give the class a name.
    const appearance_cls = ($gbl, $loc) => {};
    mod.Appearance = Sk.misceval.buildClass(mod, appearance_cls, "Appearance", []);

    const new_Appearance = (js_appearance) => {
        const pyAppearance = Sk.misceval.callsim(mod.Appearance);

        Sk.builtin.setattr(pyAppearance, s_Label,
                           new Sk.builtin.str(js_appearance.label));
        Sk.builtin.setattr(pyAppearance, s_Filename,
                           new Sk.builtin.str(js_appearance.filename));

        const pyWidth = new Sk.builtin.int_(js_appearance.image.width);
        const pyHeight = new Sk.builtin.int_(js_appearance.image.height);
        const pySize = new Sk.builtin.tuple([pyWidth, pyHeight]);
        Sk.builtin.setattr(pyAppearance, s_Size, pySize);

        const pyCentreX = new Sk.builtin.int_(js_appearance.centre_x);
        const pyCentreY = new Sk.builtin.int_(js_appearance.centre_y);
        const pyCentre = new Sk.builtin.tuple([pyCentreX, pyCentreY]);
        Sk.builtin.setattr(pyAppearance, s_Centre, pyCentre);

        return pyAppearance;
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Rendering instructions.  To ease testing, there is no interaction here
    // with an actual canvas.  Instead, the project has a method which provides
    // a list of a list of rendering instructions.  These will in general be of
    // various types, but for now the only one is 'render this image here'.


    ////////////////////////////////////////////////////////////////////////////////
    //
    // RenderImage: A request that a particular image be drawn at a particular
    // location at a particular scale.  The 'location' is that of the top-left
    // corner.  The 'image label' is ignored in real rendering but is useful for
    // testing.
    //
    // (In due course, 'at a particular angle of rotation' will be added here.)

    class RenderImage {
        constructor(x, y, scale, rotation, image, image_cx, image_cy, image_label) {
            this.kind = "RenderImage";
            this.x = x;
            this.y = y;
            this.scale = scale;
            this.rotation = rotation;
            this.image = image;
            this.image_cx = image_cx;
            this.image_cy = image_cy;
            this.image_label = image_label;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // RenderSpeechBubble: A request that a speech bubble be drawn with given
    // content, such that the tip of its arrow is at a particular location.

    class RenderSpeechBubble {
        constructor(speaker_id, content, tip_x, tip_y) {
            this.kind = "RenderSpeechBubble";
            this.speaker_id = speaker_id;
            this.content = content;
            this.tip_x = tip_x;
            this.tip_y = tip_y;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // RenderAttributeWatcher: A request that a text box like a Scratch 'variable
    // watcher' be drawn.

    class RenderAttributeWatcher {
        constructor(key, label, value, position) {
            this.kind = "RenderAttributeWatcher";
            this.key = key;
            this.label = label;
            this.value = value;
            this.position = position;
        }
    }

    ////////////////////////////////////////////////////////////////////////////////
    //
    // BoundingBox: A rectangle which tightly encloses an image.

    class BoundingBox {
        constructor(x_min, x_max, y_min, y_max) {
            this.x_min = x_min;
            this.x_max = x_max;
            this.y_min = y_min;
            this.y_max = y_max;
        }

        overlaps_with(other_bbox) {
            return ((this.x_min < other_bbox.x_max)
                    && (other_bbox.x_min < this.x_max)
                    && (this.y_min < other_bbox.y_max)
                    && (other_bbox.y_min < this.y_max));
        }

        contains_point(x, y) {
            return (this.x_min <= x && x <= this.x_max
                    && this.y_min <= y && y <= this.y_max);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // PytchActor: An actor (Sprite or Stage) within the Project.  It holds (a
    // reference to) the Python-level class (which should be derived from
    // pytch.Sprite or pytch.Stage), together with a list of its live instances.
    // There is always at least one live instance for a Sprite-derived actor;
    // other instances can be created as a result of clone() operations.  For
    // the Stage-derived actor, there is always exactly one instance.

    class PytchActor {
        constructor(py_cls, parent_project) {
            this.py_cls = py_cls;
            this.parent_project = parent_project;
            this.instances = [];

            this.event_handlers = {
                green_flag: new EventHandlerGroup(),
                keypress: new Map(),
                message: new Map(),
            };

            this.clone_handlers = [];
            this.click_handlers = [];

            this.register_event_handlers();
        }

        create_original_instance() {
            let py_instance = Sk.misceval.callsim(this.py_cls);
            this.register_py_instance(py_instance);
        }

        validate_appearance_label(descr, index, location) {
            if (typeof descr[index] !== "string")
                this.reject_appearance_descriptor(
                    descr, `label (${location}) must be a string`);
        }

        validate_appearance_filename(descr, index, location) {
            if (typeof descr[index] !== "string")
                this.reject_appearance_descriptor(
                    descr, `filename (${location}) must be a string`);
        }

        reject_appearance_descriptor(descriptor, error_message_nub) {
            let kind_name = this.appearance_single_name;
            let descriptor_tag = descriptor[0] || "???";
            let error_message = ("problem with specification"
                                 + ` for ${kind_name} "${descriptor_tag}":`
                                 + ` ${error_message_nub}`);
            throw new Sk.builtin.ValueError(error_message);
        }

        validate_sound_label(descr, index, location) {
            if (typeof descr[index] !== "string")
                this.reject_sound_descriptor(
                    descr, `label (${location}) must be a string`);
        }

        validate_sound_filename(descr, index, location) {
            if (typeof descr[index] !== "string")
                this.reject_sound_descriptor(
                    descr, `filename (${location}) must be a string`);
        }

        reject_sound_descriptor(descr, error_message_nub) {
            throw new Sk.builtin.ValueError(
                `problem with specification for Sound: ${error_message_nub}`);
        }

        register_py_instance(py_instance, maybe_py_parent) {
            let actor_instance = new PytchActorInstance(this, py_instance);
            py_instance.$pytchActorInstance = actor_instance;
            this.instances.push(actor_instance);

            let maybe_parent_instance
                = maybe_py_parent && maybe_py_parent.$pytchActorInstance;

            this.parent_project.register_for_drawing(actor_instance,
                                                     maybe_parent_instance);
        }

        get class_name() {
            return name_of_py_class(this.py_cls);
        }

        async async_load_appearances() {
            let attr_name = this.appearances_attr_name;
            let raw_descriptors = js_get_Array_attr(this.py_cls, attr_name);

            let appearance_descriptors
                = raw_descriptors.map(
                    d => this.validate_appearance_descriptor(d));

            let async_appearances = appearance_descriptors.map(
                d => Appearance.async_create(...d)
            );

            this._appearances = await Promise.all(async_appearances);
        }

        validate_sound_descriptor(descr) {
            if (descr instanceof Array) {
                const n_elts = descr.length;
                switch (n_elts) {
                case 2: { // (label, filename)
                    this.validate_sound_label(
                        descr, 0,
                        "first element of two-element descriptor");
                    this.validate_sound_filename(
                        descr, 1,
                        "second element of two-element descriptor");
                    return descr;
                }
                case 1: { // (filename,), infer label
                    this.validate_sound_filename(
                        descr, 0,
                        "sole element of one-element descriptor");
                    const filename = descr[0];
                    const label = path_stem(filename);
                    return [label, filename];
                }
                default:
                    this.reject_sound_descriptor(
                        descr,
                        "tuple descriptor must have 1 or 2 elements");
                }
            }

            if (typeof descr === "string") { // bare filename
                const label = path_stem(descr);
                return [label, descr];
            }

            this.reject_sound_descriptor(
                descr,
                "descriptor must be tuple or string");
        }

        async async_load_sounds() {
            let raw_descriptors = js_get_Array_attr(this.py_cls, s_Sounds);

            let sound_descriptors
                = raw_descriptors.map(d => this.validate_sound_descriptor(d));

            let async_sounds = sound_descriptors.map(async d => {
                try {
                    const sound = await (Sk.pytch.sound_manager
                                         .async_load_sound(...d));
                    return [d[0], sound];
                } catch (err) {
                    // Convert error to PytchAssetLoadError if it isn't
                    // already one.  We get a PytchAssetLoadError if,
                    // for example, there is no asset with that name.
                    // We get a non-PytchAssetLoadError if, for example,
                    // there is an asset but it is corrupt or of an
                    // unsupported format.
                    if (err instanceof Sk.pytchsupport.PytchAssetLoadError) {
                        throw err;
                    } else {
                        throw new Sk.pytchsupport.PytchAssetLoadError({
                            kind: "Sound",
                            path: d[1],
                            message: `(Technical details: ${err})`,
                        });
                    }
                }
            });

            let sounds = await Promise.all(async_sounds);
            this._sounds = sounds;

            this._sound_from_name = new Map();
            for (let [nm, sound] of sounds)
                this._sound_from_name.set(nm, sound);
        }

        async async_init() {
            await this.async_load_appearances();
            await this.async_load_sounds();
        }

        get n_appearances() {
            return this._appearances.length;
        }

        static set_Appearances_attr(py_cls, js_actor) {
            const py_appearances = js_actor._appearances.map(new_Appearance);
            const py_appearances_list = new Sk.builtin.list(py_appearances)
            Sk.builtin.setattr(py_cls, s_Appearances, py_appearances_list);
        }

        register_handler(event_descr, handler_py_func) {
            let [event_type, event_data] = event_descr;
            let handler = new EventHandler(this, handler_py_func);

            switch (event_type) {
            case "green-flag":
                this.event_handlers.green_flag.push(handler);
                break;

            case "message":
                let msg_handlers = this.event_handlers.message;
                if (! msg_handlers.has(event_data))
                    msg_handlers.set(event_data, new EventHandlerGroup());
                msg_handlers.get(event_data).push(handler);
                break;

            case "keypress":
                let key_handlers = this.event_handlers.keypress;
                if (! key_handlers.has(event_data))
                    key_handlers.set(event_data, new EventHandlerGroup());
                key_handlers.get(event_data).push(handler);
                break;

            case "gpio-edge":
                // TODO
                break;

            case "clone":
                this.clone_handlers.push(handler_py_func);
                break;

            case "click":
                this.click_handlers.push(handler_py_func);
                break;

            default:
                throw Error(`unknown event-type "${event_type}"`);
            }
        }

        register_handlers_of_method(im_func) {
            let [has_events_handled, py_events_handled]
                = try_py_getattr(im_func, s_pytch_handler_for);

            if (! has_events_handled)
                return;

            let js_events_handled = Sk.ffi.remapToJs(py_events_handled);
            for (let js_event of js_events_handled) {
                this.register_handler(js_event, im_func);
            }
        }

        register_event_handlers() {
            let js_dir = Sk.ffi.remapToJs(Sk.builtin.dir(this.py_cls));

            for (let js_attr_name of js_dir) {
                // Skulpt gives us things like "__eq__" in the dir() which then
                // fail when you getattr() them.  I suspect this is a bug, but
                // for now, work round by ignoring all dunder-names.
                //
                const is_dunder = (js_attr_name.startsWith("__")
                                   && js_attr_name.endsWith("__"));
                if (is_dunder)
                    continue;

                let py_attr_name = new Sk.builtin.str(js_attr_name);

                // Getting the attribute on the class object gives the
                // method descriptor object, which is a callable.
                //
                // TODO: Check we haven't got a classmethod or staticmethod.
                //
                let attr_val = Sk.builtin.getattr(this.py_cls, py_attr_name);

                if (attr_val.tp$call)
                    this.register_handlers_of_method(attr_val);
            }
        }

        // Mark the given instance as unregistered.  The actual removal
        // of the instance from our instances array is deferred until
        // end of frame, via a call to cull_unregistered_instances().
        //
        // Only marking as unregistered (rather than removing from the
        // instances array right now) avoids problems with an instance
        // existing for only some of a frame.  E.g., if an instance
        // deletes itself and clones itself in the same frame.  It also
        // makes the unregister_instance() method idempotent.
        //
        // A downside is that the code sequence
        //
        //     self.delete_this_clone()
        //     pytch.create_clone_of(self)
        //
        // is valid and succeeds in making the clone, which might be
        // counter-intuitive.  We could make delete_this_clone()
        // terminate the calling thread?
        //
        // TODO: Consider this further.
        unregister_instance(instance) {
            if (this.instances.indexOf(instance) === -1)
                throw new Error("instance not found");

            // Only unregister a true clone, i.e., one which is not the
            // original instance (which lives at index 0 in the array).
            if (instance !== this.instances[0])
                instance.py_object_is_registered = false;
        }

        create_threads_for_green_flag(thread_group) {
            this.event_handlers.green_flag.create_threads(thread_group,
                                                          this.parent_project);
        }

        create_threads_for_broadcast(thread_group, js_message) {
            let event_handler_group = (this.event_handlers.message.get(js_message)
                                       || EventHandlerGroup.empty);
            event_handler_group.create_threads(thread_group, this.parent_project);
        }

        create_threads_for_keypress(thread_group, keyname) {
            let event_handler_group = (this.event_handlers.keypress.get(keyname)
                                       || EventHandlerGroup.empty);
            event_handler_group.create_threads(thread_group, this.parent_project);
        }

        delete_all_clones() {
            this.instances.splice(1);
            this.parent_project.unregister_nearly_all_for_drawing(this,
                                                                  this.instances[0]);
        }

        cull_unregistered_instances() {
            const instances_to_cull = this.instances.filter(
                i => (! i.py_object_is_registered)
            );
            this.instances = this.instances.filter(
                i => i.py_object_is_registered
            );
            instances_to_cull.forEach(
                i => this.parent_project.unregister_for_drawing(i)
            );
        }

        launch_sound_performance(mix_bus_name, name) {
            let sound = this._sound_from_name.get(name);

            if (typeof sound === "undefined") {
                let cls_name = name_of_py_class(this.py_cls);
                throw new Sk.builtin.KeyError(
                    `could not find sound "${name}" in class "${cls_name}"`);
            }

            return sound.launch_new_performance(mix_bus_name);
        }
    }

    class PytchSprite extends PytchActor {
        static async async_create(py_cls, parent_project) {
            let sprite = new PytchSprite(py_cls, parent_project);
            await sprite.async_init();
            py_cls.$pytchActor = sprite;
            PytchActor.set_Appearances_attr(py_cls, sprite);
            sprite.create_original_instance();
            return sprite;
        }

        get layer_group() { return DrawLayerGroup.SPRITES; }

        get appearances_attr_name() { return s_Costumes; }

        get appearance_single_name() { return "Costume"; }

        get class_kind_name() { return "Sprite"; }

        validate_appearance_centre(descr, index_x, message_intro) {
            if ((typeof descr[index_x] != "number")
                || (typeof descr[index_x + 1] != "number"))
                this.reject_appearance_descriptor(
                    descr,
                    (message_intro
                     + " (centre-x and centre-y) must be numbers"));
        }

        validate_appearance_descriptor(descr) {
            if (descr instanceof Array) {
                const n_elts = descr.length;
                switch (n_elts) {
                case 4: { // (label, filename, x0, y0)
                    this.validate_appearance_label(
                        descr, 0,
                        "first element of four-element descriptor");
                    this.validate_appearance_filename(
                        descr, 1,
                        "second element of four-element descriptor");
                    this.validate_appearance_centre(
                        descr, 2,
                        "third and fourth elements of four-element descriptor");
                    return descr;
                }
                case 3: { // (filename, x0, y0), infer label
                    this.validate_appearance_filename(
                        descr, 0,
                        "first element of three-element descriptor");
                    this.validate_appearance_centre(
                        descr, 1,
                        "second and third elements of three-element descriptor");
                    const filename = descr[0];
                    const label = path_stem(filename);
                    return [label, ...descr];
                }
                case 2: { // (label, filename), infer centre (when we can)
                    this.validate_appearance_label(
                        descr, 0,
                        "first element of two-element descriptor");
                    this.validate_appearance_filename(
                        descr, 1,
                        "second element of two-element descriptor");
                    return [...descr, "auto", "auto"];
                }
                case 1: { // (filename,), infer label, centre (when we can)
                    this.validate_appearance_filename(
                        descr, 0,
                        "sole element of one-element descriptor");
                    const filename = descr[0];
                    const label = path_stem(filename);
                    return [label, filename, "auto", "auto"];
                }
                default:
                    this.reject_appearance_descriptor(
                        descr,
                        "tuple descriptor must have 1, 2, 3, or 4 elements");
                }
            }

            if (typeof descr === "string") { // bare filename
                const label = path_stem(descr);
                return [label, descr, "auto", "auto"];
            }

            this.reject_appearance_descriptor(
                descr,
                "descriptor must be tuple or string");
        }
    }

    class PytchStage extends PytchActor {
        static async async_create(py_cls, parent_project) {
            let stage = new PytchStage(py_cls, parent_project);
            await stage.async_init();
            py_cls.$pytchActor = stage;
            PytchActor.set_Appearances_attr(py_cls, stage);
            stage.create_original_instance();
            return stage;
        }

        get layer_group() { return DrawLayerGroup.STAGE; }

        get appearances_attr_name() { return s_Backdrops; }

        get appearance_single_name() { return "Backdrop"; }

        get class_kind_name() { return "Stage"; }

        validate_appearance_descriptor(descr) {
            const centre_x = STAGE_WIDTH / 2;
            const centre_y = STAGE_HEIGHT / 2;

            if (descr instanceof Array) {
                const n_elts = descr.length;
                switch (n_elts) {
                case 2: { // (label, filename)
                    return [...descr, centre_x, centre_y];
                }
                case 1: { // (filename,), infer label
                    const filename = descr[0];
                    const label = path_stem(filename);
                    return [label, filename, centre_x, centre_y];
                }
                default:
                    this.reject_appearance_descriptor(
                        descr,
                        "tuple descriptor must have 1 or 2 elements");
                }
            }

            if (typeof descr === "string") { // bare filename
                const label = path_stem(descr);
                return [label, descr, centre_x, centre_y];
            }

            this.reject_appearance_descriptor(
                descr,
                "descriptor must be tuple or string");
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // PytchActorInstance: One instance of a particular actor.

    class PytchActorInstance {
        constructor(actor, py_object) {
            this.actor = actor;
            this.py_object = py_object;
            this.numeric_id = next_global_id();
            this.py_object_is_registered = true;
        }

        js_attr(js_attr_name) {
            return js_getattr(this.py_object, new Sk.builtin.str(js_attr_name));
        }

        // Special-case these; they might be performance-sensitive.
        get render_shown() { return js_getattr(this.py_object, s_shown); }
        get render_x() { return js_getattr(this.py_object, s_x); }
        get render_y() { return js_getattr(this.py_object, s_y); }
        get render_size() { return js_getattr(this.py_object, s_size); }
        get render_rotation() { return js_getattr(this.py_object, s_rotation); }

        get render_appearance_index() {
            const appearance_index
                  = js_getattr(this.py_object, s_appearance_index);

            if (typeof appearance_index !== "number")
                throw new Sk.builtin.ValueError("appearance-index must be a number");
            if (appearance_index !== Math.floor(appearance_index))
                throw new Sk.builtin.ValueError("appearance-index must be an integer");

            const upper_bound = this.actor.n_appearances;
            if (appearance_index < 0 || appearance_index >= upper_bound)
                throw new Sk.builtin.ValueError(
                    `appearance-index must be in the range [0, ${upper_bound})`);

            return appearance_index;
        }

        get render_speech() { return js_getattr(this.py_object, s_speech); }

        get layer_group() { return this.actor.layer_group; }

        clear_speech() {
            const clear_speech_method = Sk.builtin.getattr(this.py_object, s_clear_speech);
            Sk.misceval.callsim(clear_speech_method);
        }

        rendering_instructions() {
            if (! this.render_shown)
                return [];

            let size = this.render_size;
            let appearance_index = this.render_appearance_index;
            let appearance = this.actor._appearances[appearance_index];

            const render_x = this.render_x;
            const render_y = this.render_y;

            let costume_instructions = [
                new RenderImage(render_x,
                                render_y,
                                size,
                                this.render_rotation,
                                appearance.image,
                                appearance.centre_x,
                                appearance.centre_y,
                                appearance.label),
            ];

            // Don't really like this 'initialise then overwrite' approach but
            // otherwise we have to either pass x, y, size, appearance down or
            // re-extract them.
            //
            let speech_instructions = [];
            const speech = this.render_speech;
            if (speech[2] != "") {
                let kind = speech[1];

                // Position the tip of the speech-bubble's arrow in the centre
                // of the top edge of the image.
                let tip_x = render_x;
                let tip_y = render_y + size * appearance.centre_y;

                switch (kind) {
                case "say": {
                    speech_instructions = [
                        new RenderSpeechBubble(this.numeric_id,
                                               speech[2],
                                               tip_x,
                                               tip_y),
                    ];
                    break;
                }
                default:
                    throw Error(`unknown speech kind "${kind}"`);
                }
            }

            return [...costume_instructions, ...speech_instructions];
        }

        bounding_box() {
            let size = this.render_size;
            let appearance_index = this.render_appearance_index;
            let appearance = this.actor._appearances[appearance_index];

            // Annoying mixture of addition and subtraction, and care needed
            // with respect to which is min and which is max, to account for the
            // different coordinate systems of appearance-centre vs stage.
            let x_min = this.render_x - size * appearance.centre_x;
            let y_max = this.render_y + size * appearance.centre_y;
            let x_max = x_min + size * appearance.image.width;
            let y_min = y_max - size * appearance.image.height;

            return new BoundingBox(x_min, x_max, y_min, y_max);
        }

        is_touching(other) {
            const both_shown = (this.render_shown && other.render_shown);

            if (! both_shown)
                return false;

            let bbox_0 = this.bounding_box();
            let bbox_1 = other.bounding_box();

            return bbox_0.overlaps_with(bbox_1);
        }

        unregister_self() {
            let actor = this.actor;
            actor.unregister_instance(this);
        }

        get class_name() {
            return this.actor.class_name;
        }

        get info_label() {
            return `${this.class_name}-${this.numeric_id}`;
        }

        create_click_handlers_threads(thread_group) {
            this.actor.click_handlers.forEach(
                py_fun => thread_group.create_thread(py_fun,
                                                     this.py_object,
                                                     this.actor.parent_project));
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // LoopIterationBatchingState: How to handle yield_until_next_frame() calls
    // in a loop.  We allow control of how many loop iterations can happen in a
    // single call to one_frame().  This is managed by a system of credits.
    // While a thread has a positive number of credits, it "spends" one per
    // loop-body iteration it runs.  If it has no credits when about to start a
    // loop-body iteration, it yields, and is given a new supply of credits
    // ready for when it resumes.

    class LoopIterationBatchingState {
        constructor(iterations_per_frame) {
            if (typeof iterations_per_frame !== "number"
                    || iterations_per_frame != (iterations_per_frame | 0)
                    || iterations_per_frame <= 0)
                throw Error("LoopIterationBatchingState(): positive integer required");

            this.iterations_per_frame = iterations_per_frame;
            this.credits = iterations_per_frame;
        }

        should_yield() {
            const should_yield = this.credits === 0;

            if (this.credits == 0)
                this.credits = this.iterations_per_frame

            this.credits -= 1;

            return should_yield;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Thread: One particular thread of execution.  Creating a new Thread
    // prepares to run the given Python callable with the single given argument.

    class Thread {
        constructor(thread_group, py_callable, py_arg, parent_project) {
            this.thread_group = thread_group;

            // Fake a skulpt-suspension-like object so we can treat it the
            // same as any other suspension in the scheduler.
            this.skulpt_susp = {
                resume: () => Sk.misceval.callsimOrSuspend(py_callable, py_arg)
            };
            this.parent_project = parent_project;
            this.state = Thread.State.RUNNING;
            this.sleeping_on = null;

            this.actor_instance = py_arg.$pytchActorInstance;
            this.callable_name = js_getattr(py_callable, Sk.builtin.str.$name);

            this.loop_iteration_batching_states = [new LoopIterationBatchingState(1)];
        }

        is_running() {
            return this.state == Thread.State.RUNNING;
        }

        is_zombie() {
            return this.state == Thread.State.ZOMBIE;
        }

        raised_exception() {
            return this.state == Thread.State.RAISED_EXCEPTION;
        }

        requested_stop() {
            return this.state == Thread.State.REQUESTED_STOP;
        }

        get human_readable_sleeping_on() {
            switch (this.state) {
            case Thread.State.RUNNING:
                return "-";

            case Thread.State.AWAITING_THREAD_GROUP_COMPLETION:
                return `thread group [${this.sleeping_on.label}]`;

            case Thread.State.AWAITING_PASSAGE_OF_TIME:
                return `${this.sleeping_on} frames`;

            case Thread.State.AWAITING_SOUND_COMPLETION:
                return `performance of sound "${this.sleeping_on.tag}"`;

            case Thread.State.AWAITING_GPIO_RESPONSE:
                // TODO: More detail
                return "a GPIO command";

            default:
                // We should never ask for a human-readable summary of what a
                // thread in state ZOMBIE or RAISED_EXCEPTION is waiting for.
                throw Error(`thread in bad state "${this.state}"`);
            }
        }

        should_wake() {
            switch (this.state) {
            case Thread.State.AWAITING_THREAD_GROUP_COMPLETION:
                return (! this.sleeping_on.has_live_threads());

            case Thread.State.AWAITING_PASSAGE_OF_TIME:
                this.sleeping_on -= 1;
                return (this.sleeping_on == 0);

            case Thread.State.AWAITING_SOUND_COMPLETION:
                return this.sleeping_on.has_ended;

            case Thread.State.AWAITING_ANSWER_TO_QUESTION:
                return this.sleeping_on.is_answered();

            case Thread.State.AWAITING_GPIO_RESPONSE:
                return this.sleeping_on.is_resolved();

            case Thread.State.ZOMBIE:
                return false;

            default:
                // This on purpose includes "RUNNING" and "RAISED_EXCEPTION"; we
                // should never ask if an already-RUNNING thread is ready to
                // wake up.  And if a thread threw an exception, all threads
                // should have been thrown away immediately.
                throw Error(`thread in bad state "${this.state}"`);
            }
        }

        wake() {
            switch (this.state) {
            case Thread.State.AWAITING_THREAD_GROUP_COMPLETION:
            case Thread.State.AWAITING_PASSAGE_OF_TIME:
            case Thread.State.AWAITING_SOUND_COMPLETION:
            case Thread.State.ZOMBIE:
                // No wake-up action required.
                break;

            case Thread.State.AWAITING_ANSWER_TO_QUESTION:
                // Use the question's answer as the return value from the
                // suspension, thereby giving it back to Python.
                this.skulpt_susp.data.set_success(this.sleeping_on.value);
                break;

            case Thread.State.AWAITING_GPIO_RESPONSE:
                const gpio_command = this.sleeping_on;
                if (gpio_command.succeeded())
                    this.skulpt_susp.data.set_success(Sk.builtin.none.none$);
                else {
                    // TODO: Describe the command that failed as well as the
                    // error we got?  Or should "errorDetail" be self-contained?
                    // That might be better.
                    const err = new Sk.builtin.RuntimeError(
                        `GPIO command failed: ${gpio_command.state.errorDetail}`
                    );
                    this.skulpt_susp.data.set_failure(err);
                }
                break;

            default:
                // Should never wake up a RUNNING or RAISED_EXCEPTION thread.
                throw Error(`thread in bad state "${this.state}"`);
            }

            this.state = Thread.State.RUNNING;
            this.sleeping_on = null;
        }

        maybe_wake() {
            if ((! this.is_running()) && this.should_wake()) {
                this.wake();
            }
        }

        maybe_cull() {
            if (! this.actor_instance.py_object_is_registered) {
                this.state = Thread.State.ZOMBIE;
                this.sleeping_on = null;
            }
        }

        enact_syscall(syscall_kind, syscall_args) {
            switch (syscall_kind) {
            case "next-frame": {
                return [];
            }

            case "broadcast": {
                let message = syscall_args.message;
                let new_thread_group
                    = (this.parent_project
                       .thread_group_for_broadcast_receivers(message));

                if (syscall_args.wait) {
                    this.state = Thread.State.AWAITING_THREAD_GROUP_COMPLETION;
                    this.sleeping_on = new_thread_group;
                }

                return [new_thread_group];
            }

            case "play-sound": {
                let sound_name = syscall_args.sound_name;
                let actor_instance = syscall_args.py_obj.$pytchActorInstance;
                let actor = actor_instance.actor;
                let mix_bus_name = actor_instance.info_label;

                let performance = actor.launch_sound_performance(
                    mix_bus_name,
                    sound_name
                );

                if (syscall_args.wait) {
                    this.state = Thread.State.AWAITING_SOUND_COMPLETION;
                    this.sleeping_on = performance;
                }

                return [];
            }

            case "wait-seconds": {
                let n_seconds = syscall_args.n_seconds;
                let raw_n_frames = Math.ceil(n_seconds * FRAMES_PER_SECOND);
                let n_frames = (raw_n_frames < 1 ? 1 : raw_n_frames);

                this.state = Thread.State.AWAITING_PASSAGE_OF_TIME;
                this.sleeping_on = n_frames;

                return [];
            }

            case "register-instance": {
                let { py_instance, py_parent_instance } = syscall_args;
                let py_cls = Sk.builtin.getattr(py_instance, Sk.builtin.str.$class);
                let actor = py_cls.$pytchActor;
                actor.register_py_instance(py_instance, py_parent_instance);

                let thread_group = new ThreadGroup("start-as-clone");
                actor.clone_handlers.forEach(
                    py_fun => thread_group.create_thread(py_fun,
                                                         py_instance,
                                                         this.parent_project));

                return [thread_group];
            }

            case "unregister-running-instance": {
                this.actor_instance.unregister_self();

                if (! this.actor_instance.py_object_is_registered) {
                    this.state = Thread.State.ZOMBIE;
                    this.sleeping_on = null;
                }

                return [];
            }

            case "ask-and-wait-for-answer": {
                const { prompt } = syscall_args;
                const question = this.parent_project.enqueue_question(prompt);

                this.state = Thread.State.AWAITING_ANSWER_TO_QUESTION;
                this.sleeping_on = question;

                return [];
            }

            case "show-object-attribute": {
                const { py_object, py_attribute_name, label, position } = syscall_args;

                this.parent_project.show_object_attribute(
                    py_object,
                    py_attribute_name,
                    label,
                    position
                );

                return [];
            }

            case "hide-object-attribute": {
                const { py_object, py_attribute_name } = syscall_args;

                this.parent_project.hide_object_attribute(py_object, py_attribute_name);

                return [];
            }

            case "stop-all-threads": {
                this.state = Thread.State.REQUESTED_STOP;
                return [];
            }

            case "send-blocking-gpio-command": {
                const { operation } = syscall_args;

                const pending_command
                      = this.parent_project.enqueue_gpio_command(operation, true);

                this.state = Thread.State.AWAITING_GPIO_RESPONSE;
                this.sleeping_on = pending_command;

                // TODO: Warning in webapp if a command-set is
                // outstanding for more than NNNN frames.  Hopefully
                // can make NNNN small.  To be experimented with.

                return [];
            }

            default:
                throw Error(`unknown Pytch syscall "${syscall_kind}"`);
            }
        }

        one_frame_error_context() {
            const instance = this.actor_instance;
            return {
                kind: "one_frame",
                event_label: this.thread_group.label,
                target_class_kind: instance.actor.class_kind_name,
                target_class_name: instance.class_name,
                callable_name: this.callable_name,
            };
        }

        one_frame() {
            if (! this.is_running())
                return [];

            try {
                Sk.pytch.executing_thread = this;

                let susp_or_retval = null;

                try {
                    susp_or_retval = this.skulpt_susp.resume();
                } catch (err) {
                    Sk.pytch.on_exception(err, this.one_frame_error_context());
                    this.state = Thread.State.RAISED_EXCEPTION;
                    this.skulpt_susp = null;
                    return [];
                }

                if (! susp_or_retval.$isSuspension) {
                    // Python-land code ran to completion; thread is finished.
                    this.state = Thread.State.ZOMBIE;
                    this.skulpt_susp = null;
                    return [];
                } else {
                    // Python-land code invoked a syscall.

                    let susp = susp_or_retval;
                    if (susp.data.type !== "Pytch") {
                        const err = new Error("cannot handle non-Pytch suspension"
                                              + ` of type "${susp.data.type}"`);
                        Sk.pytch.on_exception(err, this.one_frame_error_context());
                        this.state = Thread.State.RAISED_EXCEPTION;
                        this.skulpt_susp = null;
                        return [];
                    }

                    let syscall_args = susp.data.subtype_data;

                    // When the thread next runs, which might be on the next frame for some
                    // syscalls, we want it to resume the new suspension:
                    this.skulpt_susp = susp;

                    try {
                        return this.enact_syscall(susp.data.subtype, syscall_args);
                    } catch (err) {
                        // Defer the error until next time the innermost
                        // Python-level code runs.
                        susp.data.set_failure(err);
                        return [];
                    }
                }
            } finally {
                Sk.pytch.executing_thread = null;
            }
        }

        should_yield() {
            let active_loop_yield_state
                = this.loop_iteration_batching_states[
                    this.loop_iteration_batching_states.length - 1];

            return active_loop_yield_state.should_yield();
        }

        push_loop_iterations_per_frame(iterations_per_frame) {
            this.loop_iteration_batching_states.push(
                new LoopIterationBatchingState(iterations_per_frame));
        }

        pop_loop_iterations_per_frame() {
            if (this.loop_iteration_batching_states.length == 0)
                throw new Sk.builtin.ValueError(
                    ("cannot pop from empty LoopIterationBatchingState stack"
                     + " [SHOULD NOT HAPPEN]"));

            if (this.loop_iteration_batching_states.length == 1)
                throw new Sk.builtin.ValueError(
                    "cannot pop the base LoopIterationBatchingState");

            this.loop_iteration_batching_states.pop();
        }

        info() {
            let instance = this.actor_instance;
            return {
                event_label: this.thread_group.label,
                target_class_kind: instance.actor.class_kind_name,
                target_class_name: instance.class_name,
                callable_name: this.callable_name,
                target: `${instance.info_label} (${this.callable_name})`,
                state: this.state,
                wait: this.human_readable_sleeping_on,
            };
        }
    }

    Thread.State = {
        // RUNNING: The thread will be given a chance to run until either
        // completion or its next Pytch syscall.
        RUNNING: "running",

        // AWAITING_THREAD_GROUP_COMPLETION: The thread will not run again until
        // all the threads in the relevant thread-group have run to completion.
        // A reference to the 'relevant thread group' is stored in the Thread
        // instance's "sleeping_on" property.
        AWAITING_THREAD_GROUP_COMPLETION: "awaiting-thread-group-completion",

        // AWAITING_PASSAGE_OF_TIME: The thread will pause execution for the
        // number of frames stored in the "sleeping_on" property.  If this
        // number of frames is 1, the thread will resume at the next one_frame()
        // call.  If it's 2, the thread will remain non-runnable for the next
        // one_frame() call, and resume the one after that.  And so on.
        AWAITING_PASSAGE_OF_TIME: "awaiting-passage-of-time",

        // AWAITING_SOUND_COMPLETION: The thread will pause execution until the
        // relevant sound has finished playing.  A reference to the
        // 'performance' of the 'relevant sound' is stored in the Thread
        // instance's "sleeping_on" property.
        AWAITING_SOUND_COMPLETION: "awaiting-sound-completion",

        // AWAITING_ANSWER_TO_QUESTION: The thread has requested the VM's client
        // to ask the user a question; the thread will block until an answer is
        // given.  A reference to the UserQuestion is stored in the Thread
        // instance's "sleeping_on" property.
        AWAITING_ANSWER_TO_QUESTION: "awaiting-answer-to-question",

        // AWAITING_GPIO_RESPONSE: The thread has sent a GPIO command and needs
        // to receive the response before proceeding.
        AWAITING_GPIO_RESPONSE: "awaiting-gpio-response",

        // ZOMBIE: The thread has terminated but has not yet been cleared from
        // the list of live threads.
        ZOMBIE: "zombie",

        // RAISED_EXCEPTION: The thread raised an exception.
        RAISED_EXCEPTION: "raised-exception",

        // REQUESTED_STOP: The thread requested all threads be stopped.
        REQUESTED_STOP: "requested-stop",
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // ThreadGroup: A collection of threads, all of which started in
    // response to the same event, such as green-flag or a message
    // being broadcast.

    class ThreadGroup {
        constructor(label) {
            this.label = label;
            this.threads = [];
        }

        create_thread(py_callable, py_arg, parent_project) {
            this.threads.push(new Thread(this, py_callable, py_arg, parent_project));
        }

        raised_exception() {
            return this.threads.some(t => t.raised_exception());
        }

        requested_stop() {
            return this.threads.some(t => t.requested_stop());
        }

        has_live_threads() {
            return (this.threads.length > 0);
        }

        maybe_wake_threads() {
            this.threads.forEach(t => t.maybe_wake());
        }

        maybe_cull_threads() {
            this.threads.forEach(t => t.maybe_cull());
        }

        one_frame() {
            let new_thread_groups = map_concat(t => t.one_frame(), this.threads);

            this.threads = this.threads.filter(t => (! t.is_zombie()));

            if (this.has_live_threads())
                new_thread_groups.push(this);

            return new_thread_groups;
        }

        threads_info() {
            return this.threads.map(t => t.info());
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // EventHandler: A description of something which should happen in response
    // to some event, for example a green flag click, or the receipt of a
    // broadcast message.  Holds (a reference to) the PytchActor which will
    // respond to this event, and the function (instancemethod) within the
    // actor's class which will be called if the event happens.

    class EventHandler {
        constructor(pytch_actor, py_func) {
            this.pytch_actor = pytch_actor;
            this.py_func = py_func;
        }

        create_threads(thread_group, parent_project) {
            this.pytch_actor.instances.forEach(
                i => thread_group.create_thread(this.py_func,
                                                i.py_object,
                                                parent_project));
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // EventHandlerGroup: A collection of EventHandlers all dealing with the same
    // event and all belonging to the same Actor.  A given Actor can have multiple
    // methods all decorated "@when_green_flag_clicked", for example.

    class EventHandlerGroup {
        constructor() {
            this.handlers = [];
        }

        push(handler) {
            this.handlers.push(handler);
        }

        get n_handlers() {
            return this.handlers.length;
        }

        create_threads(thread_group, parent_project) {
            this.handlers.forEach(h => h.create_threads(thread_group, parent_project));
        }
    }

    // A useful 'do nothing' instance.
    EventHandlerGroup.empty = new EventHandlerGroup();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Layer group of things to draw
    //
    // Each layer-group contains an array of instances.  Actor-instances earlier
    // in that array are drawn before actor-instances later in that array, and
    // so the last actor-instance in the array is at the 'front' of the
    // layer-group from the point of view of the visible result.

    class DrawLayerGroup {
        static get STAGE() { return 0; }
        static get SPRITES() { return 1; }
        static get TEXT() { return 2; }  // One day.

        constructor() {
            this.instances = [];
        }

        /** Register the given instance as part of this draw-layer-group.  If
         * maybe_parent is given, the `instance` is inserted into the
         * layer-group such that `instance` appears immediately behind
         * `maybe_parent`.  If `maybe_parent` is not given, `instance` appears
         * at the very front.
         */
        register(instance, maybe_parent) {
            if (maybe_parent != null) {
                const parent_index = this.instances.indexOf(maybe_parent);
                if (parent_index === -1)
                    throw Error("could not find parent instance in draw-layer-group");

                // For the new instance to show as just behind its parent, we
                // want to insert it just before the parent in the array.
                this.instances.splice(parent_index, 0, instance);
            } else {
                this.instances.push(instance);
            }
        }

        unregister(instance) {
            this.instances = this.instances.filter(a => a !== instance);
        }

        unregister_nearly_all(actor, instance_to_keep) {
            this.instances = this.instances.filter(
                a => (a === instance_to_keep || a.actor !== actor));
        }

        move(instance, move_kind, index_or_offset) {
            let current_index = this.instances.indexOf(instance);
            if (current_index === -1)
                throw Error("could not find instance in draw-layer-group");

            const n_instances = this.instances.length;
            let new_index = null;

            switch (move_kind) {
            case "absolute": {
                new_index = index_or_offset;
                if (new_index < 0)
                    new_index = n_instances + new_index;
                break;
            }
            case "relative": {
                new_index = current_index + index_or_offset;
                break;
            }
            default:
                throw Error(`unknown move-kind "${move_kind}"`);
            }

            if (new_index < 0)
                new_index = 0;
            if (new_index >= n_instances)
                new_index = n_instances - 1;

            // Try a simple-minded implementation first.  If performance becomes
            // important, we can do something cleverer.
            this.instances.splice(current_index, 1);
            this.instances.splice(new_index, 0, instance);
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Text input mechanism via "ask question and wait for answer"
    //
    // The project maintains a queue of yet-to-be-answered questions, each an
    // instance of UserQuestion.  The question at the front of the queue is the
    // "live question", and the VM's client should get the answer from the user
    // in whatever way is suitable.  When that answer is available, the client
    // should provide it to the Project via Project.accept_question_answer().
    //
    // The "WAITING_TO_BE_ASKED" state is redundant with "not first in the
    // queue", but perhaps one day we might be able to ask more than one
    // question at once, and also there might be some advantage to having the
    // knowledge in the UserQuestion itself.

    class UserQuestion {
        constructor(prompt) {
            this.id = UserQuestion.next_id();
            this.prompt = prompt;  // JavaScript string or null
            this.state = UserQuestion.State.WAITING_TO_BE_ASKED;
            this.value = null;  // Python string object (once set)
        }

        is_answered() {
            return (this.state === UserQuestion.State.ANSWERED);
        }

        is_waiting_for_answer() {
            return (this.state === UserQuestion.State.WAITING_FOR_ANSWER);
        }

        set_being_asked() {
            this.state = UserQuestion.State.WAITING_FOR_ANSWER;
        }

        set_answer(py_value) {
            if (this.state !== UserQuestion.State.WAITING_FOR_ANSWER)
                throw new Sk.builtin.RuntimeError(
                    `expecting to be in state waiting-for-answer`
                    + ` but in state ${this.state}`);

            this.value = py_value;
            this.state = UserQuestion.State.ANSWERED;
        }
    }

    UserQuestion.next_id = (() => {
        let id = 50000;
        return () => (++id);
    })();

    UserQuestion.State = {
        WAITING_TO_BE_ASKED: "waiting-to-be-asked",
        WAITING_FOR_ANSWER: "waiting-for-answer",
        ANSWERED: "answered",
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Slight generalisation of Scratch "variable watcher"

    class ObjectAttributeWatcher {
        constructor(py_object, py_attribute_name, label, position) {
            this.py_object = py_object;

            // Keep both Python string, for passing to getattr(), and JS string,
            // for comparisons in maybe_watcher_index().
            this.py_attribute_name = py_attribute_name;
            this.attribute_name = Sk.ffi.remapToJs(py_attribute_name);

            this.key = `${this.object_key_component}/${this.attribute_name}`;

            this.label = label;
            this.position = position;
        }

        get object_key_component() {
            if (this._object_key_component == null) {
                let kc;
                if (this.py_object.$pytchActorInstance != null) {
                    kc = `${this.py_object.$pytchActorInstance.numeric_id}`;
                } else if (this.py_object.$isPytchMainProgramModule) {
                    kc = "__main__";
                } else {
                    // Nothing special; use a fresh unique id.
                    kc = `${next_global_id()}`;
                }
                this._object_key_component = kc;
            }

            return this._object_key_component;
        }

        rendering_instruction() {
            // Allow any exception generated by get-attribute to pass up to caller.
            const py_value = Sk.builtin.getattr(this.py_object, this.py_attribute_name);
            const py_str_value = new Sk.builtin.str(py_value);
            const str_value = py_str_value.v;

            return new RenderAttributeWatcher(
                this.key,
                this.label,
                str_value,
                this.position
            );
        }

        partial_error_context() {
            const maybe_actor_instance = this.py_object.$pytchActorInstance;
            if (maybe_actor_instance != null) {
                const actor = maybe_actor_instance.actor;
                return {
                    owner_kind: actor.class_kind_name,
                    owner_name: actor.class_name,
                };
            } else if (this.py_object.$isPytchMainProgramModule) {
                return {
                    owner_kind: "global",
                };
            } else {
                // TODO: Be more helpful if py_object is a class object,
                // e.g., for "class GameState: score = 200" use-case?
                return {
                    owner_kind: "unknown",
                };
            }
        }

        get object_is_live() {
            // If we're watching an attribute of the main top-level module, then
            // we're always live.
            //
            // Otherwise, if we're *not* watching a once-registered Actor
            // instance, we're live.  E.g., maybe we're watching an attribute
            // of a (non-Actor) GameState class.
            //
            // Otherwise (i.e., we *are* watching a once-registered Actor
            // instance), we're live iff the instance is still registered, i.e.,
            // it hasn't been deleted via delete_this_clone().

            return (
                this.py_object.$isPytchMainProgramModule
                || (this.py_object.$pytchActorInstance == null)
                || this.py_object.$pytchActorInstance.py_object_is_registered
            );
        };
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Interaction with GPIOs

    // Make truly global to avoid one build's commands clashing with another's.
    //
    if (globalThis.pytch__gpio_next_seqnum == null)
        globalThis.pytch__gpio_next_seqnum = 88000;

    const GPIO_next_seqnum = () => ++globalThis.pytch__gpio_next_seqnum;

    const GPIO_MAX_N_RESET_POLLS = 30;

    class GpioCommand {
        constructor(operation, has_thread_waiting) {
            this.seqnum = GPIO_next_seqnum();
            this.operation = operation;
            this.has_thread_waiting = has_thread_waiting;
            this.state = { status: "not-sent" };
        }

        ensure_status(tag, expected_status) {
            if (this.state.status !== expected_status)
                throw new Error(
                    `${tag}: expecting status "${expected_status}"`
                    + ` but have status "${this.state.status}"`
                );
        }

        mark_sent(frame_idx) {
            this.ensure_status("mark_sent()", "not-sent");
            this.state = {
                status: "awaiting-response",
                t_command_sent: frame_idx,
            };
        }

        // Return whether an error response must be handled by caller.
        handle_response(response, frame_idx) {
            this.ensure_status("handle_response()", "awaiting-response");

            // Properties common to both outcomes (set others below):
            this.state = {
                t_command_sent: this.state.t_command_sent,
                t_response_received: frame_idx,
            };

            switch (response.kind) {
            case "error":
                this.state.status = "failed";
                this.state.errorDetail = response.errorDetail;
                // Will this error be handled by turning into exception in
                // user code?  If not, the caller must handle it.
                //
                // TODO: What if thread terminates before response arrives, e.g.,
                // with red-stop, or exception elsewhere, or pytch.stop_all()?
                return ( ! this.has_thread_waiting);
            case "ok":
            case "report-input":
                this.state.status = "succeeded";
                // Doesn't actually matter what we return here, since this is
                // not an error response:
                return false;
            default:
                throw new Error(
                    `unexpected response-kind "${response.kind}"`
                );
            }
        }

        as_command_obj() {
            return { ...this.operation, seqnum: this.seqnum };
        }

        succeeded() {
            return (this.state.status === "succeeded");
        }

        failed() {
            return (this.state.status === "failed");
        }

        is_resolved() {
            return this.succeeded() || this.failed();
        }
    }

    class GpioCommandQueue {
        constructor() {
            this.unsent_commands = [];
            this.commands_awaiting_response = new Map();
        }

        enqueue_for_sending(operation, has_thread_waiting) {
            const command = new GpioCommand(operation, has_thread_waiting);
            this.unsent_commands.push(command);
            return command;
        }

        send_unsent(frame_idx) {
            // Avoid sending an empty message.
            if (this.unsent_commands.length === 0)
                return;

            const command_objs = this.unsent_commands.map(
                c => c.as_command_obj()
            );
            Sk.pytch.gpio_api.send_message(command_objs);

            this.unsent_commands.forEach(c => {
                c.mark_sent(frame_idx);
                this.commands_awaiting_response.set(c.seqnum, c);
            });

            this.unsent_commands = [];
        }

        // Return whether an error response must be handled by caller.
        handle_response(response, frame_idx) {
            // Ignore "unsolicited response":
            if (response.seqnum === 0)
                return true;

            const command = this.commands_awaiting_response.get(response.seqnum);
            if (command == null) {
                // Ignore any errors arising from this response; maybe it's from
                // a previous build:
                // TODO: Warn `not expecting response w seqnum ${response.seqnum}`
                return false;
            } else {
                this.commands_awaiting_response.delete(response.seqnum);
                return command.handle_response(response, frame_idx);
            }
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Javascript-level "Project" class

    class Project {
        constructor(py_project) {
            this.py_project = py_project;
            this.actors = [];
            this.thread_groups = [];

            // Queue of yet-to-be-answered questions; the one at the front of
            // the queue should either: be being asked by the VM's client; or have
            // received an answer from the VM's client.
            this.unanswered_questions = [];

            // List of project's 'attribute watchers'.  Every frame, each
            // attribute-watcher causes an attribute to be retrieved from an
            // object, as specified by that watcher.  The object's attribute's
            // value is then included in the project's rendering instructions,
            // with the intent that it be shown in a similar way to a Scratch
            // 'shown variable'.  Also in the rendering instruction is a label
            // and stage position.
            //
            this.object_attribute_watchers = [];

            // List of 'layer groups'.  Each layer-group is a list.
            // The groups are drawn in order, so things in
            // lower-indexed layer-groups are hidden by things in
            // higher-indexed groups.  The layer groups are intended
            // for stage, sprites, and text (when implemented), in
            // that order.  See the constants defined in the
            // DrawLayerGroup class.
            //
            // Within a layer-group list, things earlier in that list
            // are drawn first, and so appear as further from the
            // viewer.
            //
            this.draw_layer_groups = [
                new DrawLayerGroup(),  // Stage
                new DrawLayerGroup(),  // Sprites
                new DrawLayerGroup(),  // Text (one day)
            ];

            // Map from pin number to set of pull-kinds.  If any such
            // set has more than one pull-kind in it, that's an error.
            this.gpio_hat_block_inputs = new Map();

            this.gpio_reset_state = { status: "not-started" };
            this.gpio_pin_levels = new Map();
            this.gpio_command_queue = new GpioCommandQueue();
        }

        actor_by_class_name(cls_name) {
            let actors_having_name
                = this.actors.filter(s => name_of_py_class(s.py_cls) == cls_name);

            if (actors_having_name.length > 1)
                throw Error(`duplicate PytchActors with name "${cls_name}"`);

            if (actors_having_name.length === 0)
                throw Error(`no PytchActors with name "${cls_name}"`);

            return actors_having_name[0];
        }

        instance_0_by_class_name(cls_name) {
            return this.actor_by_class_name(cls_name).instances[0];
        }

        async register_sprite_class(py_sprite_cls) {
            Sk.builtin.setattr(py_sprite_cls, s_pytch_parent_project, this.py_project);
            let sprite = await PytchSprite.async_create(py_sprite_cls, this);
            this.actors.push(sprite);
        }

        async register_stage_class(py_stage_cls) {
            Sk.builtin.setattr(py_stage_cls, s_pytch_parent_project, this.py_project);
            let stage = await PytchStage.async_create(py_stage_cls, this);
            // Ensure Stage is first in 'actors' array, so that it renders
            // first, i.e., at the bottom.  This will be done differently once
            // z-order is implemented.
            this.actors.unshift(stage);
        }

        register_for_drawing(actor_instance, maybe_parent_instance) {
            let layer_group = this.draw_layer_groups[actor_instance.layer_group];
            layer_group.register(actor_instance, maybe_parent_instance);
        }

        unregister_for_drawing(actor_instance) {
            let layer_group = this.draw_layer_groups[actor_instance.layer_group];
            layer_group.unregister(actor_instance);
        }

        unregister_nearly_all_for_drawing(actor, instance_to_keep) {
            let layer_group = this.draw_layer_groups[actor.layer_group];
            layer_group.unregister_nearly_all(actor, instance_to_keep);
        }

        /**
         * Move the given instance within its draw-layer-group
         *
         * `instance` is the PytchActorInstance to move from its
         * current location in its draw-layer-group.
         *
         * `move_kind` should be one of the string "absolute" or
         * "relative"; this determines the interpretation of
         * `index_or_offset`.
         *
         * If `move_kind` is "absolute", `index_or_offset` gives the
         * desired index of the given `instance` in the new ordering
         * of its draw-layer-group.  A given index of zero means that
         * the instance will be drawn first, i.e., appear furthest
         * from the viewer, within its draw-layer-group.  Negative
         * indexes are interpreted as in Python, i.e., as (length of
         * list) - |negative_index|.  So 'go to back' is
         *
         *     move_kind "absolute", index_or_offset (index) 0,
         *
         * and 'go to front' is
         *
         *     move_kind "absolute", index_or_offset (index) -1.
         *
         * If `move_kind` is "relative", `index_or_offset` gives an
         * offset which should be added to the index where the given
         * `instance` can currently be found in its draw-layer-group
         * to arrive at the desired index in the new ordering.  So 'go
         * forward 3 layers' is
         *
         *     move_kind "relative", index_or_offset (offset) 3,
         *
         * and 'go backward 2 layers' is
         *
         *     move_kind "relative", index_or_offset (offset) -2.
         *
         * In either case, if the desired index is less than zero or
         * refers to a position beyond the end of the list, it is
         * clamped.
         */
        move_within_draw_layer_group(instance, move_kind, index_or_offset) {
            let layer_group = this.draw_layer_groups[instance.layer_group];
            layer_group.move(instance, move_kind, index_or_offset);
        }

        sprite_instances_are_touching(py_sprite_instance_0, py_sprite_instance_1) {
            let actor_instance_0 = py_sprite_instance_0.$pytchActorInstance;
            let actor_instance_1 = py_sprite_instance_1.$pytchActorInstance;

            // TODO: Proper pixel-wise collision detection.
            return actor_instance_0.is_touching(actor_instance_1);
        }

        instance_is_touching_any_of(py_sprite_instance, py_other_sprite_class) {
            let instance = py_sprite_instance.$pytchActorInstance;
            let other_sprite = py_other_sprite_class.$pytchActor;
            return other_sprite.instances.some(
                other_instance => instance.is_touching(other_instance));
        }

        on_green_flag_clicked() {
            // Stop the world before re-launching anything.
            this.on_red_stop_clicked();

            let thread_group = new ThreadGroup("green-flag");
            this.actors.forEach(a => a.create_threads_for_green_flag(thread_group));
            this.thread_groups.push(thread_group);
        }

        thread_group_for_broadcast_receivers(js_message) {
            let thread_group = new ThreadGroup(`message "${js_message}"`);
            this.actors.forEach(a => a.create_threads_for_broadcast(thread_group,
                                                                    js_message));
            return thread_group;
        }

        launch_keypress_handlers() {
            let new_keydowns = Sk.pytch.keyboard.drain_new_keydown_events();
            new_keydowns.forEach(keyname => {
                let thread_group = new ThreadGroup(`keypress "${keyname}"`);
                this.actors.forEach(a => a.create_threads_for_keypress(thread_group,
                                                                       keyname));
                this.thread_groups.push(thread_group);
            });
        }

        // Check for the first shown sprite instance whose bounding box contains the
        // given point (stage_x, stage_y).  If one is found, launch any click
        // handlers it has.  (If no shown true sprite is found, the sole instance of
        // the Stage-derived class should have been hit since it covers the whole
        // stage coordinate space.)
        launch_click_handlers(stage_x, stage_y) {
            let shown_instances = this.shown_instances_front_to_back();
            let hit_instance = shown_instances.find(instance => {
                let bbox = instance.bounding_box();
                return bbox.contains_point(stage_x, stage_y);
            });

            // Really should find something because the Stage covers every possible
            // (stage-x, stage-y) point, but be careful:
            if (typeof hit_instance == "undefined")
                return;  // TODO: Log a warning first?

            let thread_group = new ThreadGroup(`click "${hit_instance.info_label}"`);
            hit_instance.create_click_handlers_threads(thread_group);

            this.thread_groups.push(thread_group);
        }

        launch_mouse_click_handlers() {
            let new_clicks = Sk.pytch.mouse.drain_new_click_events();

            new_clicks.forEach(click => {
                this.launch_click_handlers(click.stage_x, click.stage_y);
            });
        }

        register_gpio_hat_block_input(pin, pull_kind) {
            if (! this.gpio_hat_block_inputs.has(pin))
                this.gpio_hat_block_inputs.set(pin, new Set());
            this.gpio_hat_block_inputs.get(pin).add(pull_kind);
        }

        do_gpio_reset_step() {
            if (this.gpio_reset_state.status === "not-started") {
                // We manually check for responses, so doesn't really matter
                // what we claim about whether a thread is waiting:
                const reset_command = new GpioCommand({ kind: "reset" }, false);
                Sk.pytch.gpio_api.send_message([reset_command.as_command_obj()]);
                this.gpio_reset_state = {
                    status: "pending",
                    seqnum: reset_command.seqnum,
                    n_polls_done: 0,
                };
            }

            if (this.gpio_reset_state.status === "pending") {
                const gpio_responses = Sk.pytch.gpio_api.acquire_responses();
                const matching_responses = gpio_responses.filter(
                    r => r.seqnum === this.gpio_reset_state.seqnum
                );

                if (matching_responses.length > 0) {
                    if (matching_responses.length > 1)
                        console.warn("multiple responses to reset; using first");
                    const reset_response = matching_responses[0];
                    const responseKind = reset_response.kind;
                    if (responseKind === "ok")
                        this.gpio_reset_state = { status: "succeeded" };
                    else
                        this.gpio_reset_state = {
                            status: "failed",
                            failureKind: "error-response",
                            errorDetail: reset_response.errorDetail,
                        };
                } else {
                    // No matching responses.
                    ++this.gpio_reset_state.n_polls_done;

                    if (this.gpio_reset_state.n_polls_done == GPIO_MAX_N_RESET_POLLS) {
                        const errorDetail = (
                            `polled limit of ${this.gpio_reset_state.n_polls_done}`
                            + " times with no response"
                        );
                        this.gpio_reset_state = {
                            status: "failed",
                            failureKind: "timeout",
                            errorDetail,
                        };
                    }
                }
            }
        }

        set_gpio_level(pin, level) {
            // This is "fire and forget"; the calling thread does not block.
            this.enqueue_gpio_command({ kind: "set-output", pin, level }, false);
        }

        get_gpio_level(pin) {
            const maybe_level = this.gpio_pin_levels.get(pin);
            if (maybe_level == null)
                throw new Sk.builtin.RuntimeError(
                    `pin ${pin} has not been set as input`
                );

            return maybe_level;
        }

        enqueue_gpio_command(operation, has_thread_waiting) {
            const reset_status = this.gpio_reset_state.status;
            switch (reset_status) {
            case "succeeded":
                return this.gpio_command_queue.enqueue_for_sending(
                    operation, has_thread_waiting
                );

            case "not-started":
            case "pending":
                throw new Sk.builtin.RuntimeError(
                    `cannot perform GPIO operation ${operation.kind}`
                    + ` because GPIO reset is ${reset_status}`
                    + " (this should not happen)"
                );

            case "failed":
                throw new Sk.builtin.RuntimeError(
                    `cannot perform GPIO operation ${operation.kind}`
                    + " because GPIO reset failed: "
                    + this.gpio_reset_state.errorDetail
                );
            }
        }

        handle_gpio_responses(responses) {
            let error_outside_thread = false;
            responses.forEach(response => {
                const error_needs_handling = this.gpio_command_queue.handle_response(response);

                switch (response.kind) {
                case "report-input":
                    const pin = response.pin;
                    const lvl = response.level;
                    // TODO: Check lvl is 0 or 1.
                    this.gpio_pin_levels.set(pin, lvl);
                    break;
                case "ok":
                    // OK, thanks!
                    break;
                case "error":
                    if (error_needs_handling) {
                        const err = new Sk.builtin.RuntimeError(
                            `GPIO error: ${response.errorDetail}`
                        );
                        // TODO: Any further context possible? Capture stack
                        // trace when original command was sent, and include
                        // that in context?
                        const ctx = { kind: "delayed_gpio" };

                        Sk.pytch.on_exception(err, ctx);
                        error_outside_thread = true;
                    }
                    break;
                default:
                    // Split "error" from "unknown"?
                    throw new Error(`unk op ${JSON.stringify(response)}`);
                }
            });

            return error_outside_thread;
        }

        one_frame() {
            this.do_gpio_reset_step();
            if (this.gpio_reset_state.status === "pending")
                // TODO: Fix duplication of return value type.
                return { exception_was_raised: false, maybe_live_question: null };

            const gpio_responses = Sk.pytch.gpio_api.acquire_responses();
            const gpio_error_outside_thread = this.handle_gpio_responses(gpio_responses);

            if ( ! gpio_error_outside_thread) {
                this.launch_keypress_handlers();
                this.launch_mouse_click_handlers();

                this.thread_groups.forEach(tg => tg.maybe_cull_threads());
                this.thread_groups.forEach(tg => tg.maybe_wake_threads());

                let new_thread_groups = map_concat(tg => tg.one_frame(),
                                                   this.thread_groups);

                this.thread_groups = new_thread_groups;
            }

            const exception_was_raised
                  = this.thread_groups.some(tg => tg.raised_exception());

            if (gpio_error_outside_thread || exception_was_raised)
                this.kill_all_threads_questions_sounds();

            // Tests in Scratch show that as well as stopping all scripts,
            // the "Stop All" block:
            //
            //     Stops all sounds
            //     Deletes all clones
            //     Cancels all "ask and wait" questions
            //     Clears all speech bubbles
            //
            // I.e., does the same as the red stop button.
            //
            if (this.thread_groups.some(tg => tg.requested_stop()))
                this.on_red_stop_clicked();

            this.maybe_retire_answered_question();
            this.cull_watchers_of_deleted_clones();
            this.cull_unregistered_instances();

            this.gpio_command_queue.send_unsent();

            const project_state = {
                // TODO: Add stats on GPIO operations, pin states, etc.?
                exception_was_raised,
                maybe_live_question: this.maybe_live_question(),
            };

            return project_state;
        }

        kill_all_threads_questions_sounds() {
            this.thread_groups = [];
            this.unanswered_questions = [];
            Sk.pytch.sound_manager.stop_all_performances();
        }

        on_red_stop_clicked() {
            this.kill_all_threads_questions_sounds();
            this.actors.forEach(a => a.delete_all_clones());

            // Now there is only the original instance to deal with:
            this.actors.forEach(a => a.instances[0].clear_speech());
        }

        /** Return a list of rendering instructions for the current
         * state of the project.  If an error occurs while trying to
         * construct that list, report the error via "on_exception()",
         * halt all threads and sounds, and return null. */
        rendering_instructions() {
            let instructions = [];
            let errors = [];
            this.draw_layer_groups.forEach(dlg => {
                dlg.instances.forEach(instance => {
                    try {
                        instance.rendering_instructions().forEach(instr => {
                            instructions.push(instr);
                        });
                    } catch (err) {
                        const context = {
                            kind: "render",
                            target_class_kind: instance.actor.class_kind_name,
                            target_class_name: instance.class_name,
                        };
                        errors.push({err, context});
                    }
                });
            });

            this.object_attribute_watchers.forEach(watcher => {
                try {
                    const instruction = watcher.rendering_instruction();
                    instructions.push(instruction);
                } catch (err) {
                    const context = {
                        kind: "attribute-watcher",
                        attribute_name: watcher.attribute_name,
                        ...watcher.partial_error_context()
                    };
                    errors.push({err, context});
                }
            });

            if (errors.length === 0)
                return instructions;

            errors.forEach(({err, context}) => Sk.pytch.on_exception(err, context));
            this.kill_all_threads_questions_sounds();
            return null;
        }

        do_synthetic_broadcast(js_msg) {
            let new_thread_group
                = this.thread_group_for_broadcast_receivers(js_msg);
            this.thread_groups.push(new_thread_group);
        }

        // TODO: Does a click pass through a text (speech or thought
        // bubble), when they exist?  See what Scratch does.
        //
        shown_instances_front_to_back() {
            let instances = [];
            this.draw_layer_groups.forEach(dlg => {
                dlg.instances.forEach(instance => {
                    if (instance.render_shown)
                        instances.unshift(instance);
                });
            });
            return instances;
        }

        threads_info() {
            return map_concat(tg => tg.threads_info(), this.thread_groups);
        }

        enqueue_question(prompt) {
            const question = new UserQuestion(prompt);
            this.unanswered_questions.push(question);

            // Ask immediately if queue was previously empty, i.e., if this
            // question is the only one in the queue.
            if (this.unanswered_questions.length === 1)
                question.set_being_asked();

            return question;
        }

        accept_question_answer(id, value) {
            if (this.unanswered_questions.length === 0)
                throw new Sk.builtin.RuntimeError(
                    "no unanswered questions to accept answer for");

            let live_question = this.unanswered_questions[0];

            if (id !== live_question.id)
                throw new Sk.builtin.RuntimeError(
                    `live question has id ${live_question.id} but`
                    + ` accept_question_answer() given id ${id}`);

            if (typeof value !== "string")
                throw new Sk.builtin.RuntimeError(
                    "answers to questions must be strings");

            const py_value = new Sk.builtin.str(value);

            live_question.set_answer(py_value);
        }

        maybe_retire_answered_question() {
            if (this.unanswered_questions.length > 0) {
                const live_question = this.unanswered_questions[0];
                if (live_question.is_answered()) {
                    this.unanswered_questions.shift();

                    // If, after removing the just-retired question, there is
                    // another question waiting in the queue, then ask it.
                    if (this.unanswered_questions.length > 0)
                        this.unanswered_questions[0].set_being_asked();
                }
            }
        }

        maybe_live_question() {
            if (this.unanswered_questions.length > 0) {
                const live_question = this.unanswered_questions[0];

                if (! live_question.is_waiting_for_answer())
                    throw new Sk.builtin.RuntimeError(
                        "internal error: live question is not waiting-for-answer");

                return live_question;
            } else {
                return null;
            }
        }

        /** Return the index into the OBJECT_ATTRIBUTE_WATCHERS array where an
         * existing watcher for the given object and attribute_name can be found,
         * or -1 if no such watcher exists. */
        maybe_watcher_index(py_object, attribute_name) {
            return this.object_attribute_watchers.findIndex(
                w => (w.py_object === py_object
                      && w.attribute_name === attribute_name));
        }

        effective_watcher_object(py_object) {
            return Sk.builtin.checkNone(py_object)
                ? this.$containingModule
                : py_object;
        }

        show_object_attribute(py_object, py_attribute_name, label, position) {
            const watcher = new ObjectAttributeWatcher(
                this.effective_watcher_object(py_object),
                py_attribute_name,
                label,
                position
            );

            const existing_index = this.maybe_watcher_index(
                watcher.py_object,
                watcher.attribute_name
            );

            if (existing_index >= 0) {
                this.object_attribute_watchers[existing_index] = watcher;
            } else {
                this.object_attribute_watchers.push(watcher);
            }
        }

        hide_object_attribute(py_object, py_attribute_name) {
            const existing_index = this.maybe_watcher_index(
                this.effective_watcher_object(py_object),
                Sk.ffi.remapToJs(py_attribute_name)
            );

            if (existing_index !== -1) {
                this.object_attribute_watchers.splice(existing_index, 1);
            }
        }

        cull_watchers_of_deleted_clones() {
            this.object_attribute_watchers = (
                this.object_attribute_watchers.filter(
                    w => w.object_is_live));
        }

        cull_unregistered_instances() {
            this.actors.forEach(a => a.cull_unregistered_instances());
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Python-level "Project" class

    const project_cls = function($gbl, $loc) {
        $loc.__init__ = skulpt_function(
            (self) => {
                self.js_project = new Project(self);
            },
            `Initialise SELF`,
        );

        $loc.instance_is_touching_any_of = skulpt_function(
            (self, instance, target_cls) => (
                (self.js_project.instance_is_touching_any_of(instance,
                                                             target_cls)
                 ? Sk.builtin.bool.true$
                 : Sk.builtin.bool.false$)),
            `Determine whether INSTANCE touches any TARGET_CLS instance`,
        );

        $loc.register_sprite_class = skulpt_function(
            (self, sprite_cls) => {
                let do_register = self.js_project.register_sprite_class(sprite_cls);
                return Sk.misceval.promiseToSuspension(do_register);
            },
            `Register the SPRITE_CLS class with SELF`,
        );

        $loc.register_stage_class = skulpt_function(
            (self, stage_cls) => {
                let do_register = self.js_project.register_stage_class(stage_cls);
                return Sk.misceval.promiseToSuspension(do_register);
            },
            `Register the STAGE_CLS class with SELF`,
        );

        $loc.move_within_draw_layer_group = skulpt_function(
            (self, py_instance, py_move_kind, py_index_or_offset) => {
                let instance = py_instance.$pytchActorInstance;
                let move_kind = Sk.ffi.remapToJs(py_move_kind);
                let index_or_offset = Sk.ffi.remapToJs(py_index_or_offset);

                self.js_project.move_within_draw_layer_group(instance,
                                                             move_kind,
                                                             index_or_offset);
            },
            `Change object's position in drawing order`,
        );

        $loc.go_live = skulpt_function(
            (self) => {
                Sk.pytch.current_live_project = self.js_project;
                return Sk.builtin.none.none$;
            },
            `Make SELF be the current live project`,
        );
    };

    mod.Project = Sk.misceval.buildClass(mod, project_cls, "Project", []);
    mod.FRAMES_PER_SECOND = new Sk.builtin.int_(FRAMES_PER_SECOND);
    mod.STAGE_WIDTH = new Sk.builtin.int_(STAGE_WIDTH);
    mod.STAGE_HEIGHT = new Sk.builtin.int_(STAGE_HEIGHT);


    ////////////////////////////////////////////////////////////////////////////////

    return mod;
};
