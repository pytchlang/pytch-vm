Threading model
---------------

.. contents::
   :depth: 1
   :local:
   :backlinks: none

The threading model is fundamentally cooperative rather than
pre-emptive. The Skulpt compiler has been modified to automatically
insert ‘cede control’ calls in the bodies of ‘for’ and ‘while’ loops.
This is a pragmatic approach, and gives behaviour close to Scratch’s:
people are used to saying ``forever: …``, and so we wanted the Python
equivalent ``while True: …`` to behave similarly.

Thread groups
~~~~~~~~~~~~~

The entire set of threads is held in a collection of ‘thread groups’.
Each one contains one or more threads. Each thread is in a particular
state, such as running, or sleeping while waiting to be woken by some
external condition.

The primary motivation for collecting threads into groups was to ease
the implementation of the Scratch-like ‘broadcast and wait’ mechanism,
whereby the thread performing the broadcast then sleeps until all
threads created in response to that broadcast have run to completion.

Automatically-inserted cede-control points
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To give semi-automatic ceding of control, in support of familiar Scratch
idioms like ``forever: do-once-per-frame-stuff``, we want to have the
Skulpt compiler insert ‘yield-until-next-frame’ (‘YNF’) calls into loop
bodies, but only for ‘Pytch programs’. A ‘Pytch program’ is detected by
the presence of an ``import pytch`` statement; after seeing such an
import, all for and while loops have YNF calls inserted as the first
statement of their bodies.  The effect of this is that there is a yield
point *before* each run of a loop body.  Inserting the YNF call at the
end of the loop body would have the undesired effect that ``continue``
statements would bypass the yield.

There is precedent for this behaviour, whereby a magic import changes
the language’s semantics, in Python’s various
``from __future__import something`` mechanisms.

Time is sliced by ‘frame’
~~~~~~~~~~~~~~~~~~~~~~~~~

Every frame, all thread-groups are given the chance to run. A
thread-group has a ``one_frame()`` method to do this. It returns a list
— which might be empty — of the thread groups which are now live. This
list is found by calling all the thread-group’s contained threads’
``one_frame()`` methods, and concatenating the results. E.g., if a
broadcast is sent by a thread, we return a one-element list with the new
thread-group. If the current thread-group has at least one live thread,
then it adds itself to the returned list.

The ``Project`` then does a similar process for its thread-groups,
collecting a new list of thread-groups ready for the following frame. In
practice, it will very often be the case that the same thread-groups are
in this list across many frames.

One big assumption is that the computations within the running threads
can all complete in under 1/60 second. If this fails to hold, project
rendering will be jittery, and the project’s sense of timing, as shown
in the wait-seconds system call, will be wrong.

A thread becomes a zombie once it runs to completion at the Python
level. Or if it’s running on an object which ceases to be a registered
Pytch actor-instance.

Scheduling
~~~~~~~~~~

All execution is driven by the ``one_frame()`` method. Every running
thread gets to resume its suspended execution. There are no guarantees
about which order various threads run in.

Thread
~~~~~~

On construction, we run a Python callable, supplying one argument. This
technique is used to run an unbound method, passing a particular
instance as the argument; the effect is ``obj.method()``. In fact this
is not quite true: the method call is stored as a pseudo-suspension; see
below.

All threads are running ‘on’ some instance of some actor — this is the
python object passed in on construction of the thread, and the single
argument of the callable.

Threads run until either they complete at the Python level, or they
invoke a Pytch syscall (qv) using the Skulpt suspension mechanism.

The suspension is stored in the ``Thread`` as ``skulpt_susp``. This
process is bootstrapped by duck-typing a suspension whose ``resume()``
runs the ``obj.method()`` call as noted above.

Each frame, the thread gets a chance to run: see ‘Time-slice’ below.

Diagnostics: Each registered instance (``PytchActorInstance``) is given
a global numeric ID. Threads have an info bundle with the instance
they’re running on, state, and, if waiting, a human friendly summary of
what they’re waiting on. Currently unused but could be a ‘top’-style
extra pane next to output/error panes.

Time-slice
^^^^^^^^^^

Each thread gets a call to its ``one_frame()``. That calls into Python
via the ``resume()`` of its suspension. Three things can happen as a
result:

-  Runs to completion, returning a Python object (usually ``None`` but
   doesn’t have to be). The thread is done; turned into a ``Zombie``.

-  Calls a Pytch syscall, creating a Skulpt suspension. Handled on the
   JavaScript side, e.g., broadcast message will usually create new
   thread-groups. Most syscalls act as co-operative yield points.

-  Throws a Python exception, which is turned into a JavaScript
   exception. Thread is killed and error message reported.

Thread state
~~~~~~~~~~~~

In various states. Running means ready to be ``resume()``\ ’d at next
one-frame. Zombie: no further work will be done but hasn’t been cleaned
up yet (can become zombie either because Python code has run to
completion, i.e., not invoked syscall; or because object it is running
on has become de-registered).

Sleeping / waiting threads
^^^^^^^^^^^^^^^^^^^^^^^^^^

Rest (DOC TODO: IS THIS TRUE) are various flavours of ‘execution paused
until some condition is met’. The condition stored in the ``Thread``.

Waking paused threads
^^^^^^^^^^^^^^^^^^^^^

Thread has ``maybe_wake()`` and ``should_wake()`` which test whether the
condition for resumption of that thread has occurred. Done by polling to
avoid callbacks into a project. If the live project changed between
setting up a thread and a completion callback firing, confusion could
result.

Culling zombies
^^^^^^^^^^^^^^^

The thread-group lets all its threads run, collecting new thread-groups
as noted elsewhere. Some of its threads might have run to completion on
the Python side, i.e., the function / method call returned. Such a
thread becomes a Zombie; the thread-group culls zombies. Doing so might
mean that there are no threads any more; in that case the thread-group
does not include itself in the list of for-next-frame thread groups it
returns.

Types of sleep
^^^^^^^^^^^^^^

-  Passage of time

-  Thread group completion

-  Sound completion
