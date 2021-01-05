Actor: Sprite and Stage
-----------------------

Much behaviour is shared between ``Sprite`` and ``Stage``, so there is a
base class on the Python side. This class is the ``Actor`` class.

As in Scratch, there is one ‘master’ instance of each ``Actor`` class.
There can be other instances of Sprite-derived classes. These are
‘clones’. The ``Stage`` cannot have clones.

When building a Pytch program, the Python runtime inside Skulpt creates
whatever classes are in the program. To be clear, the actual classes are
created, not their instances. This is just the normal way of running a
Python program in Skulpt. The last few lines of a Pytch program have to
be some boilerplate which creates a ``Project``, registers with it all
user-defined ``Sprite``-derived or ``Stage``-derived classes, and then
makes that project the ‘live’ one. As part of registering a class with a
``Project``, the master instance of that class is created and itself
registered with the ``Project``.

(In principal, an instance could exist at the Python level but be
unknown to Pytch. Currently new instances are meant to be created and
registered in one breath via ``clone()``, but there is no fundamental
reason why these concepts couldn’t be separated.)

Sprite attributes for display
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Sprites can move, change size, hide themselves, or show themselves.
Properties tracking these changes live in the base Pytch-provided
``Sprite`` class, along with methods to mutate them. These methods have
Scratch-like names, such as ``change_x()``.

Costumes and backdrops
~~~~~~~~~~~~~~~~~~~~~~

``Sprite``\ s and the ``Stage`` both have a choice of ways in which they
can be represented in the project’s rendering. For a ``Sprite``, these
are ‘Costumes’, and for the ``Stage``, these are ‘Backdrops’. The code
refers to them both under the name ``Appearance``.

On the JavaScript side, each ``Appearance`` has a JavaScript ``Image``,
and also the coordinates of the ‘origin’ of the costume. When a
``Sprite`` is at a particular location on the stage, it is the ‘origin’
of its current Costume’s ``Image`` which is at that location.

A ``Sprite``\ ’s collection of Costumes, or the ``Stage``\ ’s collection
of Backdrops, is described and stored as a list. This gives the
collection of appearances a sequence, so it makes sense to talk about
switching to the ‘next costume’ or the ‘next backdrop’.

Within the web-app, images are loaded asynchronously on class
registration. For testing, a hard-coded map provides the dimensions of
an image given a URL.

How Stage differs from Sprite
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``Stage`` has ‘Backdrops’ (whose size is assumed to be 480x360 and
whose ‘centre’ is the actual centre) instead of ‘Costumes’. The
``Stage`` has no location or size, and is always shown.

The ``Stage`` should always appear at the ‘back’ of the rendering. Until
proper z-ordering is implemented, the web-app just ensures that the
``Stage`` is rendered first.
