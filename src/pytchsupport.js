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
        (obj.sk$klass && Sk.builtin.issubclass(obj, cls) && obj !== cls));

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
    if (Sk.pytchsupport.module_has_Project_instance(mod))
        return;

    const pytch = Sk.pytchsupport.pytch_in_module(mod);
    const pytch_Project = pytch.$d.Project;

    // Create a Project instance by calling the class object.
    const py_project = Sk.misceval.callsim(pytch_Project);
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
            throw new Sk.pytchsupport.PytchBuildError({
                phase: "register-actor",
                phaseDetail: {
                    kind,
                    className: Sk.ffi.remapToJs(Sk.builtin.getattr(cls, Sk.builtin.str("__name__"))),
                },
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
        throw new Sk.pytchsupport.PytchBuildError({
            phase: "import",
            phaseDetail: null,
            innerError: err,
        });
    }

    await Sk.pytchsupport.maybe_auto_configure_project(module);

    return module;
});

////////////////////////////////////////////////////////////////////////////////

/**
 * Pytch-specific errors.
 */


/**
 * Exception subclass representing the failure to load a project asset.
 *
 * Construct with three arguments:
 *
 *     (error_message, asset_kind, asset_path)
 *
 * where 'asset_kind' should be "image" or "sound".
 */
Sk.pytchsupport.PytchAssetLoadError = function (args) {
    var o;
    if (! (this instanceof Sk.pytchsupport.PytchAssetLoadError)) {
        o = Object.create(Sk.pytchsupport.PytchAssetLoadError.prototype);
        o.constructor.apply(o, arguments);
        return o;
    }
    Sk.builtin.StandardError.apply(this, arguments);

    // Undo the traceback-seeding done in Sk.builtin.BaseException().
    this.traceback = [];
};
Sk.abstr.setUpInheritance("PytchAssetLoadError",
                          Sk.pytchsupport.PytchAssetLoadError,
                          Sk.builtin.StandardError);


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
Sk.pytchsupport.PytchBuildError = function(...args) {
    // Convert args into form expected by StandardError.
    const details = args[0];
    args[0] = "Could not build project";

    if (! (this instanceof Sk.pytchsupport.PytchBuildError)) {
        let o = Object.create(Sk.pytchsupport.PytchBuildError.prototype);
        o.constructor.apply(o, args);
        return o;
    }
    Sk.builtin.StandardError.apply(this, args);
    Object.assign(this, details);
}
Sk.abstr.setUpInheritance("PytchBuildError",
                          Sk.pytchsupport.PytchBuildError,
                          Sk.builtin.StandardError);


////////////////////////////////////////////////////////////////////////////////

[
    "pytch_in_module",
    "actors_of_module",
    "module_has_Project_instance",
    "maybe_auto_configure_project",
    //
    "PytchAssetLoadError",
    "PytchBuildError",
].forEach(
    fun_name => {
        Sk.exportSymbol(`Sk.pytchsupport.${fun_name}`, Sk.pytchsupport[fun_name]);
    });
