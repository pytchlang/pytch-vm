Functions in the pytch module
=============================

TODO: Check and update the below list.

* ``pytch.wait_seconds(n_seconds)`` makes the script calling
  ``wait_seconds()`` do nothing for ``n_seconds`` seconds before
  resuming; currently this is done by counting frames, so complicated
  scripts which render at less than 60fps will wait for the wrong
  amount of time; fixing this is on the roadmap
* ``pytch.broadcast(message_string)`` broadcasts the message
  ``message_string``, launching any scripts with a matching
  ``@pytch.when_I_receive()`` decorator (hat-block); the script calling
  ``broadcast()`` continues, with the responses happening concurrently
* ``pytch.broadcast_and_wait(message_string)`` broadcasts the message
  ``message_string``, launching any scripts with a matching
  ``@pytch.when_I_receive()`` decorator (hat-block); the script
  calling ``broadcast_and_wait()`` waits until all those scripts have
  finished before continuing
* ``pytch.key_pressed(key_name)`` gives a true/false answer as to
  whether the key with name ``key_name`` is currently pressed
* ``pytch.stop_all()`` stops all currently-executing scripts.  It also
  stops all sounds, deletes all clones, abandons all "ask and wait"
  questions, and clears all speech bubbles.  It does the same job as
  the "red stop" button.


Variable watchers
-----------------

.. note::
   This is an experimental part of Pytch.  In future versions of
   Pytch, we might change the way variable watchers work, depending on
   user feedback.

In Scratch, you can "show" a variable, either by ticking a box in the
UI, or by using the *show variable MY-VARIABLE* block.  Pytch does not
have a box to tick, but does have the ``pytch.show_variable()``
function.  The simplest way to show a variable is to use
``pytch.show_variable()`` like this:

.. code-block:: python
   :emphasize-lines: 4

   @pytch.when_I_receive("set-up-score")
   def set_up_score(self):
       self.score = 0
       pytch.show_variable(self, "score")

As this example shows, you give Pytch two pieces of information: you
tell it who owns the variable you want to show (here, the ``self``
sprite), and you tell it the **name** of the variable, as a string
(here, ``"score"``).  In this simple form, the Stage will show a small
'watcher' box with a *label* and the variable's *value*.  By default,
the label is the same as the variable name, and the watcher appears in
the top-left corner of the stage.

You can tell Pytch where to show the watcher by giving it more
information.  You can choose whether to fix the *left* or *right* edge
of the box, by giving the stage *x*-coordinate where you want that
edge to be.  You can separately choose whether to fix the *top* or
*bottom* edge, by giving a stage *y*-coordinate.  You can tell also
Pytch what label to use, instead of the variable name.

To pass any of these arguments, use Python's *named argument* syntax.
In this example, we pass ``label``, ``top``, and ``right`` as named
arguments:

.. code-block:: python

   pytch.show_variable(self, "score", label="SCORE:", top=176, right=236)

This will set up a watcher for ``self.score``, showing the value with
the label ``SCORE:``, a little way in from the top-right corner of the
stage.


Sprite variables and clones
~~~~~~~~~~~~~~~~~~~~~~~~~~~

In Scratch, you can only show the original instance's value of a "for
this Sprite only" variable.  In Pytch, you can show a clone's value of
the variable.  When a clone is running a method, ``self`` refers to
that clone.

When a clone is deleted, any variable watchers showing variables
belonging to that clone are removed.


Project-level variables
~~~~~~~~~~~~~~~~~~~~~~~

Sometimes you will have a variable at the top level of your project, outside any
Sprite or Stage.  These are also called "global" variables.  As a
special case, to show these variables, you can use ``None`` as the
first argument to ``show_variable()``, for example:

.. code-block:: python
   :emphasize-lines: 7

   score = 100

   class Ship(pytch.Sprite):
       # [...]
       @pytch.when_this_sprite_clicked
       def show_score(self):
           pytch.show_variable(None, "score")



Advanced usage
~~~~~~~~~~~~~~

Most Pytch programs will not need to use the techniques in this
section.

In fact any attribute will do, so you can for example give the name of
a *property* to compute the value dynamically.  This property will be
accessed 60 times a second so should not do any heavy computation.

So far we have given examples where the "variable owner", i.e., the
first argument to ``pytch.show_variable()``, is a Sprite, or your
Stage, or ``None`` to mean a global variable.  It can also be any
other object in your program, for instance a non-Actor class:

.. code-block:: python
   :emphasize-lines: 1-2,8

   class GameState:
       score = 100

   class Ship(pytch.Sprite):
       # [...]
       @pytch.when_this_sprite_clicked
       def show_score(self):
           pytch.show_variable(GameState, "score")


Suspiciously long-running loops outside event handlers
------------------------------------------------------

Most users will not need to use the functionality described in this
section.

In Pytch, it is common to have an infinite loop (e.g., ``while True``)
inside an event handler.  Such a loop runs at one iteration per
display frame.

But an infinite loop at the top level of your program will prevent
your project even starting.  For example,

.. code-block:: python

   import pytch

   while True:
       pass

Pytch detects this situation, and raises an error.  It is impossible
for Pytch to tell when a loop is truly infinite, though, and so it
raises this error if more than 1000 iterations of loops happen when
launching your program.  Rarely, you might genuinely have a program
which needs a longer-running loop at top-level.  If so, you can raise
the limit as follows.

.. function:: pytch.set_max_import_loop_iterations(n_iters)

   Set the maximum number of loop iterations permitted at top level
   before an error is raised.

For example:

.. code-block:: python

   import pytch

   # Without the following line, the loop below would raise an error.
   pytch.set_max_import_loop_iterations(2000)

   for i in range(1200):
       pass
