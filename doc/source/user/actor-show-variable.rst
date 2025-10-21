In Scratch, you can "show" a variable, either by ticking a box in the
UI, or by using the *show variable MY-VARIABLE* block.  Pytch does not
have a box to tick, but you can show a sprite's (or the stage's)
variable with the ``self.show_variable()`` function.  The argument is
the **name** of the sprite's (or stage's) variable, which means you
will often want to give a quoted string, for example:

.. code-block:: python

   self.show_variable("score")

(There is a more general version available; see :ref:`its
documentation<pytch_variable_watchers>` for details.)
