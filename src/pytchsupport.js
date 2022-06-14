/**
 * @namespace Sk.pytchsupport
 *
 */

Sk.pytchsupport = Sk.pytchsupport || {};


/**
 * Functions to support Pytch.
 *
 */

////////////////////////////////////////////////////////////////////////////////

/**
 * Wrap a JS function into a Python function with a docstring
 *
 * Adds properties to the passed-in fun object:
 *
 *   co_docstring --- Python string created from JS string doc (if defined)
 */

Sk.pytchsupport.skulpt_function = (fun, doc) => {
    if (doc != null)
        fun.co_docstring = new Sk.builtin.str(doc);
    return new Sk.builtin.func(fun);
};


/**
 * Return the imported "pytch" module from the given object (in usage, this
 * object will be a module).  Throw a Skulpt SyntaxError if no "pytch" found.
 *
 * TODO: Assert that "pytch" refers to a module?
 */
Sk.pytchsupport.pytch_in_module = (mod => {
    if (mod.$d.hasOwnProperty('pytch'))
        return mod.$d.pytch;
    else
        throw new Sk.builtin.SyntaxError('module does not do "import pytch"');

    // TODO: Would an ImportError be better here?
});


/**
 * Return a list of the actors (Sprites or Stages) in the given module.  Each
 * entry in the list is an object of the form
 *
 * { cls: Python class object,
 *   kind: JS string "Sprite" or "Stage" }
 */
Sk.pytchsupport.actors_of_module = (mod => {
    const pytch = Sk.pytchsupport.pytch_in_module(mod);
    const pytch_Sprite = pytch.$d.Sprite;
    const pytch_Stage = pytch.$d.Stage;

    const is_strict_subclass = (obj, cls) => (
        Sk.builtin.checkClass(obj)
        && Sk.builtin.issubclass(obj, cls).v
        && obj !== cls
    );

    let actors = [];

    Object.values(mod.$d).forEach(attr => {
        if (is_strict_subclass(attr, pytch_Sprite))
            actors.push({ cls: attr, kind: "Sprite" });
        if (is_strict_subclass(attr, pytch_Stage))
            actors.push({ cls: attr, kind: "Stage" });
    });

    return actors;
});


/**
 * Predicate testing whether a given object has an attribute which is an
 * instance of the Pytch class Project.
 *
 * Assumes the given object has done "import pytch".
 */
Sk.pytchsupport.module_has_Project_instance = (mod => {
    const pytch = Sk.pytchsupport.pytch_in_module(mod);
    const cls_Project = pytch.$d.Project;

    const is_Project_instance = (
        obj => Sk.misceval.isTrue(Sk.builtin.isinstance(obj, cls_Project)));

    return Object.values(mod.$d).some(is_Project_instance);
});


/**
 * If the given module lacks a Project instance, create one inside it, and
 * register all Sprite and Stage subclasses found in the module with that
 * Project.  Then make that project the 'current live' one.
 */
Sk.pytchsupport.maybe_auto_configure_project = (async mod => {
    // If the user has already made their own Project, leave it alone.
    //
    // TODO: Set the "$containingModule" property?  Or decide we will
    // stop supporting non-auto-config'd Pytch programs?
    //
    if (Sk.pytchsupport.module_has_Project_instance(mod))
        return;

    const pytch = Sk.pytchsupport.pytch_in_module(mod);
    const pytch_Project = pytch.$d.Project;

    // Create a Project instance by calling the class object.
    let py_project;
    try {
        py_project = Sk.misceval.callsim(pytch_Project);
        py_project.js_project.$containingModule = mod;
    } catch (err) {
        throw new Sk.pytchsupport.PytchBuildError({
            phase: "create-project",
            phaseDetail: null,
            innerError: err,
        });
    }

    const js_project = py_project.js_project;

    // Register all Sprite/Stage subclasses we find.
    for (const {cls, kind} of Sk.pytchsupport.actors_of_module(mod)) {
        try {
            switch (kind) {
            case "Sprite":
                await js_project.register_sprite_class(cls);
                break;
            case "Stage":
                await js_project.register_stage_class(cls);
                break;
            default:
                throw Error(`unknown kind "${kind}" of actor`);
            }
        } catch (err) {
            const className = Sk.ffi.remapToJs(
                Sk.builtin.getattr(cls, Sk.builtin.str.$name)
            );

            throw new Sk.pytchsupport.PytchBuildError({
                phase: "register-actor",
                phaseDetail: { kind, className },
                innerError: err,
            });
        }
    }

    // Insert into the module under a private name, and make it the live one.
    mod.$d.$auto_created_project = py_project;
    Sk.pytch.current_live_project = js_project;
});


/**
 * Import a module from code text, and auto-configure its project if it doesn't
 * explicitly define one already.
 */
Sk.pytchsupport.import_with_auto_configure = (async code_text => {
    let module;
    try {
        module = await Sk.misceval.asyncToPromise(
            () => Sk.importMainWithBody("<stdin>", false, code_text, true));

        // Throw error during "import" phase if code does not "import pytch".
        const ignoredResult = Sk.pytchsupport.pytch_in_module(module);
    } catch (err) {
        // If we get a SyntaxError, see if Tiger Python can give us a
        // more-useful explanation of the problem than "bad input".
        if (err instanceof Sk.builtin.SyntaxError) {
            let errs = [];
            try {
                errs = globalThis.TPyParser.findAllErrors(code_text);
            } catch (tpy_err) {
                // Leave "errs" as empty list to be correctly handled by next "if".
                console.log("TigerPython threw error", tpy_err);
            }

            if (errs.length > 0) {
                const innerError = new Sk.pytchsupport.TigerPythonSyntaxAnalysis({
                    errors: errs,
                });
                throw new Sk.pytchsupport.PytchBuildError({
                    phase: "import",
                    phaseDetail: null,
                    innerError,
                });
            }
        }

        throw new Sk.pytchsupport.PytchBuildError({
            phase: "import",
            phaseDetail: null,
            innerError: err,
        });
    }

    // Other sorts of PytchBuildError might be thrown by the following; let them
    // propagate to our caller if so.
    await Sk.pytchsupport.maybe_auto_configure_project(module);

    // Ensure other bits of the code (the motivating case being detection of
    // when we're showing a module attribute, i.e., global variable) can tell
    // this is the module of the user's main program.
    module.$isPytchMainProgramModule = true;

    return module;
});


/**
 * Import a module from code text, and auto-configure its project with
 * an "image and sound loader" which simply records the names of the
 * requested assets.
 */
Sk.pytchsupport.asset_names_of_project = async (code_text) => {
    // This is clumsy; provide push/pop facility for Sk options?
    const saved_pytch_async_load_image = Sk.pytch.async_load_image;
    const saved_pytch_sound_manager = Sk.pytch.sound_manager;

    let images = [];
    const note_image_required = async (name) => {
        images.push(name);
        // Fudge this: Nothing will get called.
        return {};
    };

    let sounds = [];
    const note_sound_required = async (name) => {
        sounds.push(name);
        // Fudge this: won't get called in our case:
        return {};
    }
    const do_nothing = (() => {});
    const sound_noting_sound_manager = {
        async_load_sound: (label, filename) => note_sound_required(filename),
        stop_all_performances: do_nothing,
        one_frame: do_nothing,
    }

    try {
        Sk.pytch.async_load_image = note_image_required;
        Sk.pytch.sound_manager = sound_noting_sound_manager;

        const module = await Sk.pytchsupport.import_with_auto_configure(code_text);
        return { status: "ok", assets: images.concat(sounds) };
    } catch (err) {
        return { status: "error", error: err };
    } finally {
        Sk.pytch.sound_manager = saved_pytch_sound_manager;
        Sk.pytch.async_load_image = saved_pytch_async_load_image;
    }
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Pytch-specific errors.
 */


/**
 * Exception subclass representing the failure to load a project asset.
 *
 * Construct with a single argument, being an object having properties:
 *
 *     kind: either "Image" or "Sound"
 *     path: a string giving the location of the not-found asset
 */
Sk.pytchsupport.PytchAssetLoadError = Sk.abstr.buildNativeClass(
    "PytchAssetLoadError",
    {
        constructor: function PytchAssetLoadError(...args) {
            // Convert args into form expected by Exception.
            const details = args[0];
            args = [`could not load ${details.kind} "${details.path}"`];

            Sk.builtin.Exception.apply(this, args);
            Object.assign(this, details);
        },
        base: Sk.builtin.Exception,
    }
);


/**
 * Exception subclass representing an error while building a project.
 *
 * 'Building' here covers the compilation and import of the module and
 * also, if performed, the automatic creation of a Project object and
 * the registration with that project of the Sprite and Stage
 * subclasses found.
 *
 * The first arg args should be an object with fields "phase" (e.g.,
 * "import" or "register/register-actor"), "phaseDetail" (which can be
 * null), and "innerError".
 */
Sk.pytchsupport.PytchBuildError = Sk.abstr.buildNativeClass(
    "PytchBuildError",
    {
        constructor: function PytchBuildError(...args) {
            // Convert args into form expected by Exception.
            const details = args[0];
            args[0] = "could not build project";

            Sk.builtin.Exception.apply(this, args);
            Object.assign(this, details);
        },
        base: Sk.builtin.Exception,
    }
);


/**
 * Exception subclass representing a list of syntax errors found by
 * TigerPython.
 *
 * The first arg should be an object with property "errors", which is
 * a list of Tiger Python error objects.
 */
Sk.pytchsupport.TigerPythonSyntaxAnalysis = Sk.abstr.buildNativeClass(
    "TigerPythonSyntaxAnalysis",
    {
        constructor: function TigerPythonSyntaxAnalysis(details) {
            const msg = `TigerPython: ${details.errors.length} message/s`;
            Sk.builtin.Exception.apply(this, [msg]);
            this.syntax_errors = details.errors.map(e =>
                Object.assign(
                    new Sk.builtin.SyntaxError(e.msg, "<stdin>.py", e.line),
                    {
                        tiger_python_errorcode: e.code,
                        tiger_python_offset: e.offset,
                    }));
        },
        base: Sk.builtin.Exception,
    }
);


////////////////////////////////////////////////////////////////////////////////

[
    "skulpt_function",
    "pytch_in_module",
    "actors_of_module",
    "module_has_Project_instance",
    "maybe_auto_configure_project",
    "import_with_auto_configure",
    //
    "PytchAssetLoadError",
    "PytchBuildError",
].forEach(
    fun_name => {
        Sk.exportSymbol(`Sk.pytchsupport.${fun_name}`, Sk.pytchsupport[fun_name]);
    });
