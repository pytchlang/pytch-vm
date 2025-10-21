Create a new clone of ``thing``.  You can create clones in two ways.
You can clone the original or an existing clone of one of your
Sprites, for example a Sprite clone which is calling the
``create_clone_of()`` function:

.. code-block:: python

   self.create_clone_of(self)

(Although in this case you can use the simpler
``self.create_clone()``.)

Or you can create a clone of a particular class of Sprite:

.. code-block:: python

   self.create_clone_of(Spaceship)

In this case, Pytch makes a clone of the original instance of that
sprite.

You can also clone any instance of any sprite.  For example, if you
know there are at least three clones of a ``Spider`` sprite, you can
create a clone of the third one with:

.. code-block:: python

   self.create_clone_of(Spider.all_clones()[2])

You can not clone your Stage.
