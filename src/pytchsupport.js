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
