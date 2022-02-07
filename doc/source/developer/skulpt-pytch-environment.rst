Skulpt API / Pytch environment
------------------------------

We gather all runtime dependencies into one ‘environment’ object. This
allows automated testing outside the browser, via injection of mocks of
various things. It also keeps us honest in terms of being explicit about
what the external dependencies are.

The ‘environment’ object is the property ``pytch`` of the global
``Sk`` object.

Error handling
~~~~~~~~~~~~~~

- ``on_exception`` — function which is passed the JavaScript-level
  error (often it is also a Python exception object) and an 'error
  context' describing how the error occurred.

In tests, any errors are collected into a list. Some tests are expected
to cause errors, and this can be verified by examining that list. Most
tests should not cause any errors; an end-of-test hook verifies that no
errors remain unprocessed.

In the web-app, exceptions are displayed in a dedicated pane.

Loading costumes / backdrops
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  ``async_load_image``

Used in async registration of actor (sprite, stage) classes.

Loading, playing, stopping, monitoring sounds
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

-  ``sound_manager``

See separate section.

Keyboard
~~~~~~~~

-  ``keyboard``

Require an object to keep track of keys’ states. Need to be able to ask
whether a key is currently up or down, and to know which keys have gone
from up to down since we last asked. Maintain a list of ‘key down’
events inside the ‘keyboard’ object, and provide a way for caller to
take ownership of (‘drain’) the events in that queue.

Have methods:

-  ``key_pressed(k)`` — predicate asking whether given key is
   currently in the ‘down’ position

-  ``drain_new_keydown_events()`` — obtain list of new up->down
   transitions and empty the in-keyboard storage of that queue

A real keyboard will maintain internal state based on browser events.
Mock keyboard for testing which has methods to simulate key events.

Hat-block for ‘when pressed’; keypress handlers stored in ``PytchActor``
instance (next to green-flag and message, since these are all-instance
events); there is a predicate syscall ``pytch.is_key_pressed()``.

Mouse
~~~~~

-  ``mouse``

Similar to keyboard; have list of ‘click events’ which can be drained.
Also similar: mock and real. Real (web-app) has to do some coord
transformations. (DOC TODO: Describe real mouse here or under web-app?)

Current live project
~~~~~~~~~~~~~~~~~~~~

-  ``current_live_project``

So the web-app knows which ``Project`` to interact with. Where to send
green-flag events, which project to ask for list of rendering
instructions.
