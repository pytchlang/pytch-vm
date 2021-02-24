Docstrings
----------

Each user-facing method on ``Sprite`` or ``Stage`` should have a
docstring whose first line is suitable for use in the autocompletion
pop-up of the webapp's editor.  Currently, Skulpt's support for
introspection is incomplete, so we use a workaround for now.  The
docstring's first line can start with a ``"("`` character, in which
case everything up and including the first ``")"`` character is used
as a *suffix* when presenting the completion to the user.  For
example, the docstring

.. code-block:: python

   "(SOUND) Play SOUND; pause until it finishes playing"

for the method ``play_sound_until_done`` will result in the user being
shown something like

   *play_sound_until_done(SOUND)* — Play SOUND; pause until it finishes playing

If the docstring's first line does not start with ``"("``, no suffix
is added to the attribute name when displaying it.  For example,
the docstring

.. code-block:: python

   "The number of the costume SELF is currently wearing"

of the ``costume_number`` property will be shown along the lines of

   *costume_number* — The number of the costume SELF is currently wearing

in the webapp.

A unit test ensures that all methods and properties have docstrings,
apart from a set of hard-coded exceptions for non-user-facing
attributes.


Use within webapp
=================

A function ``pytch._user_facing_completions()`` is intended for use by
the webapp.  It returns a dictionary mapping from parent name
(``pytch``, ``Actor``, ``Sprite``, ``Stage``) to a list of simple
records giving the available user-facing attributes under that parent.
Each records is a tuple of strings::

  (attribute-name, suffix, kind, doc)

Here, ``suffix`` and ``doc`` are parsed from the first docstring line
as outlined above.  The ``kind`` slot is currently ignored by the
webapp; it is the typename of the attribute's value.
