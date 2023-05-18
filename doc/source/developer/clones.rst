Clones
------

Clones are created in two phases: First, we create a new Python instance
with the same properties as the existing one; this is done via standard
Python ``deepcopy()``. (We might hit some limitations of this in future,
but so far it seems to be working.) Second, we register that instance
with the Project; see next.

Registering a clone
~~~~~~~~~~~~~~~~~~~

When registering a clone, that counts as that instance ‘starting as a
clone’ in the Scratch sense. A list of handlers for this event is stored
in the ``PytchActor`` instance. We only want to run methods on the
particular instance being registered, so handlers are not stored in the
central event-handler map of the ``Actor``, but in a dedicated list
``clone_handlers``. Threads are created, gathered into one thread-group,
and marked ‘running’, ready for the next time round ``one_frame()``.

A newly-registered clone is inserted in the drawing order just before
the instance from which it was cloned.  This makes it appear just behind
its parent instance, from the viewer’s perspective.

‘Deleting’ a clone
~~~~~~~~~~~~~~~~~~

This only de-registers the JavaScript-side ``PytchActorInstance``. The
actual Python object can continue to exist, although nothing (except
perhaps threads: see below) within Pytch refers to it any more, so it
will play no further part in the running of the ``Project``.

We must handle races which arise if more than one thread does
delete-this-clone “concurrently” (i.e., in the same frame).

A deleted clone might have live threads on it; those threads need to be
killed. We note in the ``PytchActorInstance`` whether the Python-side
object is registered with Pytch — starts off ‘true’, set to ‘false’ on
de-registration. A thread is turned into a zombie if its target is
dereg’d.

Red stop
~~~~~~~~

When the red-stop event happens, we discard all clones (this does not
include the instance-0 ‘master’ of each Sprite) by truncating the list
of ``PytchActorInstances`` down to just its master instance. We also
empty the list of thread groups, effectively killing all threads. There
is no need for a ‘stop’ method on the ``Thread`` class, because a Thread
will never be ``one_frame()``\ ’d again given that its thread-group is
not part of the project’s ‘live thread groups’ list. And we stop all
sounds (see :doc:`own section <sounds>`).

The green-flag event does an implicit red-stop first.
