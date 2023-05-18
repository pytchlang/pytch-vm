Actor-class registration
------------------------

Each ``Actor`` class (on the Python side) has a corresponding
``PytchActor`` object on the JavaScript side. This is responsible for
holding the Costumes of a ``Sprite`` (or Backdrops of a ``Stage``), its
Sounds, and the list of live instances of that ``Actor``. There is
exactly one live instance for the ``Stage``; there is at least one for a
``Sprite``, but there can be more (if clones have been created).

We store a reference to the Python class object inside the JavaScript
``PytchActor``. For ease of going the other way for some syscalls (DOC
TODO: which?), we also attach a property to the Python class object
referring back to the JavaScript ``PytchActor``.

On construction of the ``PytchActor``, we create one Python instance,
and a corresponding ``PytchActorInstance`` object on the JavaScript
side. This Python object is the ‘original’ instance, also sometimes
referred to as ‘instance-0’.

Loading costumes / backdrops and sounds
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In web-app, this loading will be asynchronous, so the general logic has
to be too. Skulpt has a mechanism for using JavaScript promises as
Skulpt suspensions (and mapping the other way too) so this interface
point is fairly straightforward.

``PytchActorInstance``
~~~~~~~~~~~~~~~~~~~~~~

An object of the JavaScript class ``PytchActorInstance`` corresponds to
a registered Python instance of an ``Actor``-derived class. It knows
which ``PytchActor`` it’s an instance of, and it knows the Python-side
object it represents.

The consequences of a Python object being a ‘registered’ instance of an
``Actor`` class are as follows. Within the web-app, Pytch will render it
on the screen. The object will have methods called on it in response to
events such as keypresses or broadcasts.
