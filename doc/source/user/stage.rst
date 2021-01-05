The stage
=========

Your project must have a ``class`` for the stage, which must be derived
from the ``pytch.Stage`` class.  For example,

.. code:: python

   class Stage(pytch.Stage):
       # Code for your stage goes here


Methods available on the Stage
------------------------------

Your own version of the Stage can use the following methods, which are
provided by Pytch:

.. function:: self.start_sound(sound_name)
              self.play_sound_until_done(sound_name)
   :noindex:

These methods work in the same way as the ones provided by the
``Sprite`` class.  See :ref:`the help in the Sprite
page<methods_playing_sounds>` for details.  The given ``sound_name``
must refer to a Sound you have defined — see :doc:`sound-specs`.

.. function:: self.switch_backdrop(backdrop_name)

Make the Stage change its backdrop to the one with the given
``backdrop_name``.  This must be the name of a Backdrop defined by the
class's ``Backdrops`` variable — see :doc:`backdrop-specs`.

.. function:: self.switch_backdrop(backdrop_number)
   :noindex:

Make the Stage change its backdrop to the one at the given position in
its list of Backdrops.  *Zero-based* indexing is used, which means
that to switch to the first backdrop, use ``self.switch_backdrop(0)``;
to switch to the second backdrop, use ``self.switch_backdrop(1)``; and
so on.

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

.. attribute:: self.backdrop_name

The name of the currently-shown backdrop.
