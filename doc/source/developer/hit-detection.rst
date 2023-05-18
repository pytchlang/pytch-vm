Collision and click detection
-----------------------------

By bbox. ``PytchActorInstance`` has ``bounding_box()`` method.

‘Touching’ is done via bbox overlap. Non-shown instances never touch
anything.

Exposed to Pytch as a method on Sprite: ``self.touching()``,
underneath is ``instance_is_touching_any_of()`` on ``Project`` — has
to be ``Project`` because ``Project`` knows what instances are
registered of the given class.

Clicking on Sprite / Stage
~~~~~~~~~~~~~~~~~~~~~~~~~~

Done via bbox. Check each ``Sprite`` ‘from front to back’ as per the
“drawing layers”.  The ``Stage`` should always be hit if nothing else
is.  Launch “clicked” event on particular instance.  Can be more than
one click-handler.

Similar to ‘on-clone’ in that threads run on one particular object, not
all of class.

Mouse clicks drained at the start of one-frame and processed (see
:ref:`“Mouse” section of the “environment” docs <Skulpt/Pytch
environment / mouse>`).
