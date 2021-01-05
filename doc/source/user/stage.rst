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
