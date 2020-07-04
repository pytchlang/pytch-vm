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
 * Return the imported "pytch" module from the given object (in usage,
 * this object will be a module).  Throw an error if no "pytch" found.
 *
 * TODO: Assert that "pytch" refers to a module?
 */
Sk.pytchsupport.pytch_in_module = (mod => {
    if (mod.$d.hasOwnProperty('pytch'))
        return mod.$d.pytch;
    else
        throw Error('module does not do "import pytch"');
});


/**
* Return a list of the actors (Sprites or Stages) in the given module.
* Each entry in the list is an object of the form
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


////////////////////////////////////////////////////////////////////////////////

[
    "pytch_in_module",
    "actors_of_module",
].forEach(
    fun_name => {
        Sk.exportSymbol(`Sk.pytchsupport.${fun_name}`, Sk.pytchsupport[fun_name]);
    });
