.. _sound_specifications:

Defining sounds
===============

Both Sprites and the Stage can have sounds.  You will usually define
these just by their filename, for example:

.. code-block:: python

   import pytch

   class Kitten(pytch.Sprite):
       Sounds = ["miaow.mp3", "mew.mp3"]

And then you can say, for example, ``self.start_sound("mew")``.  If
you want to have a different label for a sound, you can use a
*two-element tuple* like

.. code-block:: python

   import pytch

   class Puppy(pytch.Sprite):
       Sounds = [("bark", "big-loud-bark.mp3"), "growl.mp3"]

Here we will be able to say ``self.start_sound("bark")``, which will
start playing the ``big-loud-bark.mp3`` file; or we can say
``self.start_sound("growl")``, which will start playing the
``growl.mp3`` file.  This example shows that you can give some sounds
a custom label, and leave others with their default label.


Playing sounds
--------------

Once you have given your Sprite (or Stage) some sounds as above, see
the help about the :ref:`Making sounds<methods_playing_sounds>`
methods to learn how to play them.
