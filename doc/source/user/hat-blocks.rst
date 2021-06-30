Scratch hat blocks → Pytch decorators
=====================================

Done via Python *decorators*. E.g.,

.. code:: python

       @pytch.when_I_receive("Play_One_Point")
       def prepare_to_play(self):
           # ... do stuff ...

The available decorators are:

.. attribute:: pytch.when_green_flag_clicked

   Ask Pytch to run the decorated method whenever the green flag is
   clicked by the user.

.. function:: pytch.when_key_pressed(key_name)

   Ask Pytch to run the decorated method whenever the user presses the
   given key.

.. attribute:: pytch.when_this_sprite_clicked

   Ask Pytch to run the decorated method whenever the user clicks (or
   taps) on the sprite.  Should be used only for Sprites (not your
   Stage).

.. attribute:: pytch.when_stage_clicked

   Ask Pytch to run the decorated method whenever the user clicks (or
   taps) on the stage.  Should be used only for your Stage (not
   Sprites).

.. function:: pytch.when_I_receive(message_string)

   Ask Pytch to run the decorated method whenever somebody broadcasts
   the given ``message_string``.

.. attribute:: pytch.when_I_start_as_a_clone

   Ask Pytch to run the decorated method whenever a clone of the
   Sprite is created.  Within the method, ``self`` refers to the
   newly-created clone.
