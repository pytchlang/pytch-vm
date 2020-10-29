Project
-------

There is a need for an object maintaining certain pieces of over-arching
state, such as the collection of registered Sprites, and the registered
instances of those Sprites. This job is done by the ``Project`` class.

The ‘live’ project
~~~~~~~~~~~~~~~~~~

Within the web-app, there is the concept of the current ‘live’ project,
which is the one the web-app interacts with. When a new script is built
in the web-app, a new project instance usually becomes the live one.
(One future possibility is that more than one project could run at the
same time, but we have not explored this idea.)

This concept is only relevant to the web-app. But the job of tracking
the ‘live project’ cannot be done solely within the webapp, because the
live project is set from within Python, but referred to from the
web-app.

Parent project of actor
~~~~~~~~~~~~~~~~~~~~~~~

(TODO: Can this info be moved somewhere else? When discussing
registration?) Some classes need to know which project their instances
are part of: ``PytchActor``, ``Thread``. Needed to handle broadcasts —
the project is what knows which actors handle the message.

Done on JavaScript side and also on Python side; registering a class
with a ``Project`` stores a ref to that Python-level project object
inside the registered class (``_pytch_parent_project`` attribute). Makes
it easier to implement some behaviour in Python rather than JavaScript.
