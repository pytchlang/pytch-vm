Scratch hat blocks → Pytch decorators
=====================================

Done via Python *decorators*. E.g.,

.. code:: python

       @pytch.when_I_receive("Play_One_Point")
       def prepare_to_play(self):
           # ... do stuff ...

The available decorators are:

* ``@pytch.when_I_receive(message_string)`` causes the decorated
  method to be called whenever somebody broadcasts the given
  ``message_string``
* ``@pytch.when_green_flag_clicked()`` causes the decorated method to
  be called whenever the green flag is clicked by the user
* ``@pytch.when_key_pressed(key_name_as_string)`` causes the decorated
  method to be called whenever the user presses the given key
* ``@pytch.when_this_sprite_clicked()`` causes the decorated method to
  be called whenever the user clicks / taps on the sprite
