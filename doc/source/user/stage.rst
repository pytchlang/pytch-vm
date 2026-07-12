The stage
=========

Your project must have a ``class`` for the stage, which must be derived
from the ``pytch.Stage`` class.  For example,

.. code:: python

   class Stage(pytch.Stage):
       # Code for your stage goes here


Methods and properties available on the Stage
---------------------------------------------

Your own version of the Stage can use the following methods, which are
provided by Pytch:

.. function:: self.start_sound(sound_name_or_index)
              self.play_sound_until_done(sound_name_or_index)
   :noindex:

   These methods work in the same way as the ones provided by the
   ``Sprite`` class.  See :ref:`the help in the Sprite
   page<methods_playing_sounds>` for details.  The given
   ``sound_name_or_index`` must refer to a Sound you have defined —
   see :doc:`sound-specs`.

.. _Stage_stop_all_sounds:
.. function:: self.stop_all_sounds()
   :noindex:

   Immediately stop all sounds from playing, **including those being
   played by any Sprites**.

.. function:: self.switch_backdrop(backdrop_name)

   Make the Stage change its backdrop to the one with the given
   ``backdrop_name``.  This must be the *label* of a Backdrop defined by
   the class's ``Backdrops`` variable — see :doc:`backdrop-specs`.

   If you prefer, you can assign to ``self.backdrop_name``.  These two
   lines do the same thing:

   .. code-block:: python

      self.switch_backdrop("sunshine")
      self.backdrop_name = "sunshine"

.. function:: self.switch_backdrop(backdrop_number)
   :noindex:

   Make the Stage change its backdrop to the one at the given position in
   its list of Backdrops.  *Zero-based* indexing is used, which means
   that to switch to the first backdrop, use ``self.switch_backdrop(0)``;
   to switch to the second backdrop, use ``self.switch_backdrop(1)``; and
   so on.

   If you prefer, you can assign to ``self.backdrop_number``.  These
   two lines do the same thing:

   .. code-block:: python

      self.switch_backdrop(3)
      self.backdrop_number = 3

.. function:: self.next_backdrop()

   Switch to the next backdrop in the Stage's list of backdrops.  If the
   Stage is already showing its last backdrop, switch to showing the
   first one.

.. function:: self.next_backdrop(n_steps)
   :noindex:

   Switch to the backdrop ``n_steps`` later in the Stage's list of
   backdrops.  If this takes you beyond the end of the list, wrap back
   round to the start as if in a circle.  You can use a negative number
   as ``n_steps`` to move to an *earlier* backdrop; for example,
   ``self.next_backdrop(-1)`` will change to the *previous* backdrop.

.. attribute:: self.backdrop_number

   The *zero-based* number of the currently-shown backdrop.  So if the
   Stage is currently showing its first backdrop, ``backdrop_number``
   will be 0; if it's currently showing its second backdrop,
   ``backdrop_number`` will be 1; and so on.

   You can assign to ``self.backdrop_number`` to switch backdrop.

.. attribute:: self.backdrop_name

   The name of the currently-shown backdrop.

   You can assign to ``self.backdrop_name`` to switch backdrop.


Showing and hiding the stage's variables
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. _Stage_show_variable:
.. function:: self.show_variable(variable_name)
   :noindex:

   .. include:: actor-show-variable.rst

.. function:: self.hide_variable(variable_name)
   :noindex:

   .. include:: actor-hide-variable.rst


Sensing
~~~~~~~

.. function:: self.key_pressed(key_name)
   :noindex:

   .. include:: actor-key-pressed.rst


Pausing a script
~~~~~~~~~~~~~~~~

.. function:: self.wait_seconds(n_seconds)
   :noindex:

   .. include:: actor-wait-seconds.rst


Broadcasting messages
~~~~~~~~~~~~~~~~~~~~~

.. function:: self.broadcast(message_string)
   :noindex:

   .. include:: actor-broadcast.rst

.. function:: self.broadcast_and_wait(message_string)
   :noindex:

   .. include:: actor-broadcast-and-wait.rst


Stopping all scripts
~~~~~~~~~~~~~~~~~~~~

.. function:: self.stop_all()
   :noindex:

   .. include:: actor-stop-all.rst


Creating clones of Sprites
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. function:: self.create_clone_of(thing)
   :noindex:

   .. include:: actor-create-clone-of.rst


Asking the user a question
~~~~~~~~~~~~~~~~~~~~~~~~~~

Pytch has a method matching Scratch's *ask and wait* block.  In
Scratch, you can find what the user typed using the *answer* reporter
block.  In Pytch, the user's answer is *returned* to your program from
the ``ask_and_wait()`` method.

.. function:: self.ask_and_wait(question)
   :noindex:

   Pop up an input box asking the *question*, and wait for the user to
   type in their answer.  Your method is paused while the user is typing
   their answer, and will continue once the user submits their answer.
   The answer is returned, so you will usually assign it to a variable.
   For example, this code assigns the user's answer to a variable
   ``name`` and then prints out a greeting:

   .. code:: python

      class NightSky(pytch.Stage):
          # [ ... Backdrops, Sounds, other methods, etc. ... ]
          @pytch.when_stage_clicked
          def ask_user_their_name(self):
              name = self.ask_and_wait("What's your name?")
              print(f"Hello, {name}!")

   The greeting will appear in the "Output" tab of the Pytch IDE.


Sensing the mouse's position and button
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Some devices have a "mouse", which can be used in your Pytch programs.
A mouse can tell where it is, in terms of *x* and *y* coordinates.  It
also has a main button, which is either pressed down or not.  Scratch
has reporter blocks for these three properties.  The stage works the
same as your sprites when it comes to finding out about the mouse's
state.  See :ref:`the help in the Sprite page<properties_for_mouse>`.

(The stage does not have ``touching_mouse`` or ``distance_to_mouse``
properties, though, as these would not make sense for the stage.)


Getting the stage instance
~~~~~~~~~~~~~~~~~~~~~~~~~~

(Advanced.)  If you need to get the (unique) *instance* of your Stage
class, you can use the following method.

.. function:: StageClass.the_only()

   Return a reference to the unique instance of the stage class.  This
   can be used to look up variables or send messages to the stage.

   You might not need to use this method; see
   :ref:`reading_stage_properties_through_class`.


.. _reading_stage_properties_through_class:

Reading stage properties from a sprite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As a convenience, the following Stage properties have special
behaviour, different to how properties normally work in Python:

* ``sound_volume``
* ``backdrop_number``
* ``backdrop_name``

Code which reads these properties on the Stage *class* gives the value
of that property for the (unique) Stage instance.

This can be useful where, for example, a sprite needs to know what
backdrop the stage is using.  Instead of the fiddly

.. code-block:: python

   print(Stage.the_only().backdrop_name)  # (script-by-script)
   print(MyStageClass.the_only().backdrop_name)  # (flat)

you can instead just write

.. code-block:: python

   print(Stage.backdrop_name)  # (script-by-script)
   print(MyStageClass.backdrop_name)  # (flat)

If your code is in your Stage, you should use the simpler and standard

.. code-block:: python

   print(self.backdrop_name)
