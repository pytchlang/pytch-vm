var $builtinmodule = function (name) {
    let mod = {};

    ////////////////////////////////////////////////////////////////////////////////
    //
    // Constants, convenience utilities

    const s_dunder_name = Sk.builtin.str("__name__");
    const s_im_func = Sk.builtin.str("im_func");
    const s_pytch_handler_for = Sk.builtin.str("_pytch_handler_for");

    const name_of_py_class
          = (py_cls =>
             Sk.ffi.remapToJs(Sk.builtin.getattr(py_cls, s_dunder_name)));

    const js_hasattr = (py_obj, py_attr_name) => (
        (Sk.builtin.hasattr(py_obj, py_attr_name) === Sk.builtin.bool.true$));

    const try_py_getattr = (py_obj, py_attr_name) => (
        (js_hasattr(py_obj, py_attr_name)
         ? [true, Sk.builtin.getattr(py_obj, py_attr_name)]
         : [false, null]));

    const map_concat
          = (fun, xs) => Array.prototype.concat.apply([], xs.map(fun));


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

            let py_instance = Sk.misceval.callsim(py_cls);
            let instance_0 = new PytchActorInstance(this, py_instance);
            py_instance.$pytchActorInstance = instance_0;
            this.instances = [instance_0];

            this.event_handlers = {
                green_flag: new EventHandlerGroup(),
                message: {},
            };

            this.register_event_handlers();
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
                if (! msg_handlers.hasOwnProperty(event_data))
                    msg_handlers[event_data] = new EventHandlerGroup();
                msg_handlers[event_data].push(handler);
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
                let py_attr_name = Sk.builtin.str(js_attr_name);
                let attr_val = Sk.builtin.getattr(this.py_cls, py_attr_name);

                let [has_im_func, im_func] = try_py_getattr(attr_val, s_im_func);
                if (has_im_func)
                    this.register_handlers_of_method(im_func);
            }
        }

        create_threads_for_green_flag() {
            return this.event_handlers.green_flag.create_threads(this.parent_project);
        }

        create_threads_for_broadcast(js_message) {
            let event_handler_group = (this.event_handlers.message[js_message]
                                       || EventHandlerGroup.empty);
            return event_handler_group.create_threads(this.parent_project);
        }
    }

    class PytchSprite extends PytchActor {
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // PytchActorInstance: One instance of a particular actor.

    class PytchActorInstance {
        constructor(actor, py_object) {
            this.actor = actor;
            this.py_object = py_object;
        }

        js_attr(js_attr_name) {
            return js_getattr(this.py_object, Sk.builtin.str(js_attr_name));
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Thread: One particular thread of execution.  Creating a new Thread
    // prepares to run the given Python callable with the single given argument.

    class Thread {
        constructor(py_callable, py_arg, parent_project) {
            // Fake a skulpt-suspension-like object so we can treat it the
            // same as any other suspension in the scheduler.
            this.skulpt_susp = {
                resume: () => Sk.misceval.callsimOrSuspend(py_callable, py_arg)
            };
            this.parent_project = parent_project;
            this.state = Thread.State.RUNNING;
            this.sleeping_on = null;
        }

        is_running() {
            return this.state == Thread.State.RUNNING;
        }

        is_zombie() {
            return this.state == Thread.State.ZOMBIE;
        }

        should_wake() {
            switch (this.state) {
            case Thread.State.AWAITING_THREAD_GROUP_COMPLETION:
                return (! this.sleeping_on.has_live_threads());

            default:
                // This on purpose includes "RUNNING"; we should never ask
                // if an already-RUNNING thread is ready to wake up.
                throw Error(`thread in bad state "${this.state}"`);
            }
        }

        maybe_wake() {
            if ((! this.is_running()) && this.should_wake()) {
                this.state = Thread.State.RUNNING;
                this.sleeping_on = null;
            }
        }

        one_frame() {
            if (! this.is_running())
                return [];

            let susp_or_retval = this.skulpt_susp.resume();

            if (! susp_or_retval.$isSuspension) {
                // Python-land code ran to completion; thread is finished.
                this.skulpt_susp = null;
                this.state = Thread.State.ZOMBIE;
                return [];
            } else {
                // Python-land code invoked a syscall.

                let susp = susp_or_retval;
                if (susp.data.type !== "Pytch")
                    throw Error("cannot handle non-Pytch suspensions");

                switch (susp.data.subtype) {
                case "next-frame": {
                    // The thread remains running; update suspension so we
                    // continue running on the next frame.
                    this.skulpt_susp = susp;
                    return [];
                }

                case "broadcast": {
                    // The thread remains running, as in "next-frame".
                    this.skulpt_susp = susp;

                    let js_message = susp.data.subtype_data;
                    let new_thread_group
                        = (this.parent_project
                           .thread_group_for_broadcast_receivers(js_message));

                    return [new_thread_group];
                }

                case "broadcast-and-wait": {
                    // When it resumes, this thread will pick up here.
                    this.skulpt_susp = susp;

                    let js_message = susp.data.subtype_data;
                    let new_thread_group
                        = (this.parent_project
                           .thread_group_for_broadcast_receivers(js_message));

                    this.state = Thread.State.AWAITING_THREAD_GROUP_COMPLETION;
                    this.sleeping_on = new_thread_group;

                    return [new_thread_group];
                }

                default:
                    throw Error(`unknown Pytch syscall "${susp.data.subtype}"`);
                }
            }
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

        // ZOMBIE: The thread has terminated but has not yet been cleared from
        // the list of live threads.
        ZOMBIE: "zombie",
    };


    ////////////////////////////////////////////////////////////////////////////////
    //
    // ThreadGroup: A collection of threads, all of which started in
    // response to the same event, such as green-flag or a message
    // being broadcast.

    class ThreadGroup {
        constructor(threads) {
            this.threads = threads;
        }

        has_live_threads() {
            return (this.threads.length > 0);
        }

        maybe_wake_threads() {
            this.threads.forEach(t => t.maybe_wake());
        }

        one_frame() {
            let new_thread_groups = map_concat(t => t.one_frame(), this.threads);

            this.threads = this.threads.filter(t => (! t.is_zombie()));

            if (this.has_live_threads())
                new_thread_groups.push(this);

            return new_thread_groups;
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

        create_threads(parent_project) {
            return this.pytch_actor.instances.map(
                i => new Thread(this.py_func, i.py_object, parent_project));
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

        create_threads(parent_project) {
            return map_concat(h => h.create_threads(parent_project), this.handlers);
        }
    }

    // A useful 'do nothing' instance.
    EventHandlerGroup.empty = new EventHandlerGroup();


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Javascript-level "Project" class

    class Project {
        constructor() {
            this.actors = [];
            this.thread_groups = [];
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

        register_sprite_class(py_sprite_cls) {
            this.actors.push(new PytchSprite(py_sprite_cls, this));
        }

        on_green_flag_clicked() {
            let threads = map_concat(a => a.create_threads_for_green_flag(), this.actors);
            let thread_group = new ThreadGroup(threads);
            this.thread_groups.push(thread_group);
        }

        thread_group_for_broadcast_receivers(js_message) {
            let threads = map_concat(a => a.create_threads_for_broadcast(js_message),
                                     this.actors);
            return new ThreadGroup(threads);
        }

        one_frame() {
            this.thread_groups.forEach(tg => tg.maybe_wake_threads());

            let new_thread_groups = map_concat(tg => tg.one_frame(),
                                               this.thread_groups);

            this.thread_groups = new_thread_groups;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////
    //
    // Python-level "Project" class

    const project_cls = function($gbl, $loc) {
        $loc.__init__ = new Sk.builtin.func(self => {
            self.js_project = new Project();
        });

        $loc.register_sprite_class = new Sk.builtin.func(
            (self, sprite_cls) => {
                self.js_project.register_sprite_class(sprite_cls);
            });
    };

    mod.Project = Sk.misceval.buildClass(mod, project_cls, "Project", []);


    ////////////////////////////////////////////////////////////////////////////////

    return mod;
};
