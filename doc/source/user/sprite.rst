Sprites
-------

Sprites are the things in a project that appear on the stage, move
about, and generally perform actions. Most projects will have at least
one sprite.

You control how a sprite moves and acts by writing *scripts*. Each
sprite can also have *costumes* and *sounds* that control how it looks
and sounds.

Each sprite has *methods* which are commands that you can issue to
get a sprite to do something.

Creating Sprites
~~~~~~~~~~~~~~~~

You can create a Sprite in your project by declaring a Python *class*
that uses the Sprite as a foundation. You do this by creating a class
with some name (for example, "Kitten"), and mentioning the pytch
Sprite class as it's basis. Here is an example of a Kitten class that
has a single costume (costumes are discussed just below):

.. code-block:: python
   
   import pytch

   class Kitten(pytch.Sprite):
     Costumes = ["happy-kitten.jpg"]

Controlling how a sprite looks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Each sprite can have a collection of *Costumes* that control how it
looks. The first costume mentioned will be how the sprite first
appears and you can change the Sprite's appearance using commands.

If a Sprite is to appear on the stage then it has to have at least one
costume (it's OK for a sprite to be invisible, and then it doesnt'
need to have any costumes at all). Costumes are controlled by a
variable in each Sprite that lists the images that the Sprite can
have. To use an image you have to upload it to your project, and then
you can add it to your Sprite's list of available Costumes.

You can read the details of how you list costumes in the
:ref:`assets<costume_specifications>` document.

Usually all you have to do is make a list called *Costumes* in the
sprite and list all the names of the uploaded files you want to use.

This list has to be set up as the Sprite is created (Pytch can't yet
load more images after the sprite has been set up)

The *Costumes* variable needs to be declared inside the Sprite. For
example, here is a definition for a new Sprite class that will have
two costumes:

.. code-block:: python
                
    class Kitten(pytch.Sprite):
        Costumes = ["smiling-kitten.jpg",
                    "frowning-kitten.jpg"]

By default the Sprite will use the first image as it's appearance. If
you want to change to another costume you can use the *switch_costume*
method. 


Setting the sprite size
  Method: ``self.set_size( size )``

  Set how large the sprite appears, as a proportion of the size of the
  current costume image, where ``1`` is the normal size of the image.
  For example, ``self.set_size( 0.5 )`` will set the sprite to be
  half-sized. 


Showing and hiding the sprite
  ``self.show()`` 
  
  ``self.hide()``

  Make the sprite appear or disappear from the stage. Sprites that are
  not showing can still be moved, change costume, and so on but you
  won't see the effect until the sprite is shown again. 

Changing the sprite appearance
  Method: ``self.switch_costume(name)``

  Select one of the costumes listed in this Sprites *Costumes*
  variable. The name can be either the complete filename, the filename
  without the extension, or a custom label (as described in
  :ref:`assets<costume_label_specifications>` ). For example, you might use ``self.switch_costume("smiling-kitten")`` to choose a new costume.

Controlling the order Sprites are drawn

  When one sprite overlaps another it is the order that they are drawn
  that controls what you see. Sprites on the back layer are drawn
  first, and then Sprites from the next layer are drawn on top of
  that, and so on until the front layer is reached. By moving sprites
  between layers you can control which Sprites appear on top.

  Method: ``self.move_to_front_layer()``

  Method: ``self.move_to_back_layer()``

  These methods move a sprite to the very front or the very back of the layers.

  Method: ``self.move_forward_layers(n)``

  Method: ``self.move_backward_layers(n)``

  These methods move a sprite a certain number of layers forward or backward. 


Moving a Sprite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Sprites can move their position on the stage using these motion commands. There is an exact x and y position on the stage where the "origin" of the sprite is. Normally the origin in the exact middle of the sprite's current costume, but you can change the origin when you are creating the costume (see :ref:`here<costume_label_origin_specifications>` )

  ``self.go_to_xy(x,y)``

  Move the sprite to a particular position on the stage

  ``self.change_x(dx)``

  Change the x-position of the sprite by a certain amount (for example, ``self.change_x(10)`` will move the sprite 10 pixels to the right on the stage). The number of pixels can be negative.

  ``self.change_y(dy)``
  
Change the y-position of the sprite by a certain amount (for example, ``self.change_y(10)`` will move the sprite 10 pixels up on the stage). The number can be negative.

  ``self.set_x(x)``

  Move the sprite to a certain x-position on the stage while keeping it's y-position the same.

  ``self.set_y(y)``
  
  Move the sprite to a certain y-position on the stage while keeping it's x-position the same.

  ``self.get_x()``
  
  ``self.get_y()``

  Return the current x or y position of the sprite. 


Making sounds
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Sounds have to be loaded into the Sprite when it is created (see the :ref:``assets<sounds>` document). Once a sound has been loaded you can get the sprite to play it.

  ``self.start_sound(sound_name)``

  Start a sound playing. You can refer to the sound using the file
  name from the ``Sounds`` variable in the sprite, or using a label
  (see the :ref:``assets<sounds>` document). Once the sound has
  started the Sprite will move on to it's next instruction.

  ``self.play_sound_until_done(sound_name)``

  Start a sound playing. You can refer to the sound using the file
  name from the ``Sounds`` variable in the sprite, or using a label
  (see the :ref:``assets<sounds>` document). This method will not
  return until the entire sound has played, so the script it is
  contained in won't do it's next instruction until then.


Making and deleting copies of a Sprite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Each Sprite is created on the Stage at the start of the program, but it is possible to create further copies of each Sprite when the program is running. These copies are called "clones" of the original.

  When a clone is created it starts at the same position and wearing the same costume as the original, but it can run it's own scripts to change it's behaviour. The "self" variable always refers to the _current_ clone.

  Clones can be created using the ``create_clone_of(thing)`` function (see :ref:``clones<creating_clones>``).

  ``self.delete_this_clone()``

  Remove the current clone. If this method is run by the original sprite then it has no effect, but if it is run by a clone then the clone immediately vanishes.

  ``Class.the_original()``

  This returns a reference to the _original_ object that this clone is
  a copy of. This can be used to look up variables or send messages to
  the original object. If it is run by the original Sprite then it
  returns a reference to itself. Notice that this method is run using
  the class name (for example ``Kitten.the_original()``), not the
  ``self`` object.

  ``Class.all_clones()``

  Returns a list of all the existing clones of the Sprite that is
  mentioned (for example ``Kitten.all_clones()``). Notice that this
  method is run using the class name (for example
  ``Kitten.all_clones()``), not the ``self`` object.

  ``Class.all_instances()``

  Like ``all_clones``, this returns a list of all clones of the Sprite
  that is mentioned (for example ``Kitten.all_clones()``), but
  ``all_instances`` also includes the original Sprite in the
  list. This is useful if you want acces to everything (both clones
  and originals). Notice that this method is run using the class name
  (for example ``Kitten.all_instances()``), not the ``self`` object.


Checking for sprites colliding
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  ``self.touching( target_class )``

  You can use this method to check whether this sprite is touching any
  instance of another class. For example ``self.touching(Dog)`` will
  return either True of False depending on whether the current Sprite
  is overlapping a ``Dog`` sprite.

  At the moment Pytch does not look at the actual image in the
  costume, just it's overall size, so if the two costumes have blank
  sections but the costumes themselves are overlapping then this
  method will still return true. The current costume and the size set by
  ``set_size`` is taken into account when checking. 

  Note that you check using a *class* name, so if the ``self`` sprite
  is touching any clone of the target class then ``touching`` will
  return true.


Showing and hiding speech balloons
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Speech balloons can be used to get Sprites to show some text on the Stage. 

  ``self.say(content)``

  Show a speech balloon next to the current Sprite, showing the text
  supplied. For exampler ``self.say("Hello there")``. The balloon will
  be visible until ``say_nothing()`` is run by the same Sprite. If the
  Sprite uses ``hide`` to disappear from the stage then the balloon
  will also disappear.

  ``self.say_nothing()``

  Remove a speech balloon (if there is no speech balloon shown then
  this does nothing)

  ``self.say_for_seconds(content,seconds)``

  Show a speech balloon, wait for the number of seconds given, and
  then remove it. The while script will wait while the balloon is
  being show.
