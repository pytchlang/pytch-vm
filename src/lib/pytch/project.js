var $builtinmodule = function (name) {
    let mod = {};

    ////////////////////////////////////////////////////////////////////////////////
    //
    // PytchActor: An actor (Sprite or Stage) within the Project.  It holds (a
    // reference to) the Python-level class (which should be derived from
    // pytch.Sprite or pytch.Stage), together with a list of its live instances.
    // There is always at least one live instance for a Sprite-derived actor;
    // other instances can be created as a result of clone() operations.  For
    // the Stage-derived actor, there is always exactly one instance.

    class PytchActor {
        constructor(py_cls) {
            this.py_cls = py_cls;

            let py_instance = Sk.misceval.callsim(py_cls);
            let instance_0 = new PytchActorInstance(this, py_instance);
            py_instance.$pytchActorInstance = instance_0;
            this.instances = [instance_0];
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
    // Javascript-level "Project" class

    class Project {
        constructor() {
            this.actors = [];
        }

        register_sprite_class(py_sprite_cls) {
            this.actors.push(new PytchSprite(py_sprite_cls));
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
