.. _costume_specifications:

Costumes
--------


A Sprite has *Costumes* and the Stage has *Backdrops*.  Both Sprites
and the Stage can have *Sounds*.  The way that you define these in
Pytch is quite flexible, but for most situations you will be able to
use a very simple approach.

Suppose you have added an image called ``happy-kitten.jpg`` to your
project, and you want to use this image as a costume for a sprite
``Kitten``.  You can do so like this:

.. code-block:: python

   import pytch

   class Kitten(pytch.Sprite):
       Costumes = ["happy-kitten.jpg"]

This brings in your ``happy-kitten.jpg`` file as a costume for the
``Kitten`` Sprite.  Pytch automatically switches to the first Costume
when building and launching the project, showing it in the centre of
the Stage.


Advanced Costume specifications
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sometimes you need more control over how Pytch uses your image as a
costume.  You can use the following variations independently for each
costume of a sprite.

Specifying the origin of the costume
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

By default, Pytch chooses the centre of your image as the *origin* of
your Sprite.  When you say ``go_to_xy(100, 80)``, for example, it is
the *origin* of the costume which ends up at the position (100, 80).

Sometimes you would like a different point in your image to be the
origin.  You can tell Pytch this by using a *three-element tuple* as a
costume specification.  For example,

.. code-block:: python

   import pytch

   class Spaceship(pytch.Sprite):
       Costumes = [("rocket.png", 10, 20)]

will make the origin of the ``rocket`` costume be 10 pixels left and
20 pixels down from the top-left corner of the image.  *Notice that
the 'y' coordinate goes down, rather than the usual 'positive is up'
convention for the stage.  This is to follow the usual convention for
computer images, which uses (0, 0) as the top-left corner.*

.. _costume_label_specifications:

Specifying the label of the costume
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

In this example:

.. code-block:: python

   import pytch

   class RacingCar(pytch.Sprite):
       Costumes = ["car.png", "crash.png"]

you will be able to say ``self.switch_costume("car")`` or
``self.switch_costume("crash")`` in a ``RacingCar`` method.  Pytch
uses the *stem* of the filename as the costume's label.  You might
want to refer to these costumes by different *labels* instead.  To do
that, give a *two-element tuple* for a costume, like this:

.. code-block:: python

   import pytch

   class RacingCar(pytch.Sprite):
       Costumes = [
           ("fast-car", "car.png"),
           ("crashed-car", "crash.png"),
       ]

With these specifications, you now say
``self.switch_costume("fast-car")`` or
``self.switch_costume("crashed-car")`` in your code.

.. _costume_label_origin_specifications:

Specifying the label and the origin of the costume
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you want to control both the label and the origin, give a
*four-element tuple*, such as:

.. code-block:: python

   import pytch

   class Hero(pytch.Sprite):
       Costumes = [("running", "running-person.jpg", 25, 30)]

This will give a costume based on the image ``running-person.jpg``,
which you will switch to with ``self.switch_costume("running")``, and
whose origin is the point 25 pixels from the left and 30 pixels from
the top of the image.



Backdrops
---------

For the Stage, the normal way to specify a Backdrop is to just give
the filename of the file you have added to your project.  For example,

.. code-block:: python

   import pytch

   class Sky(pytch.Stage):
       Backdrops = ["night.jpg", "day.jpg"]

will give you a Stage having backdrops you can switch to with
``self.switch_backdrop("night")`` or ``self.switch_backdrop("day")``.
Because Backdrops always cover the whole Stage, there is no concept of
an origin for Backdrops.  You can, though, specify a label, for
example,

.. code-block:: python

   import pytch

   class Table(pytch.Stage):
       Backdrops = [
           ("wooden", "wooden-table.jpg"),
           ("metal", "metal-table.jpg"),
       ]



Sounds
------

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
