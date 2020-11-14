Syscalls
--------

When a Pytch program needs the services of the Pytch runtime, it uses a
‘syscall’. This is implemented with the Skulpt suspension mechanism.
Most Pytch syscalls return a Skulpt suspension, which makes the
``resume()`` call return a Suspension rather than a Python value. The
suspension captures the ‘continuation’ of that computation.

Most syscalls cause a thread to yield. The approach is motivated to some
extent by the Linux kernel’s top-half / bottom-half interrupt
processing. It did not seem very clean to have the syscall itself
rummage around in the live project or its thread groups. For example, we
don’t know which Pytch Thread object we’re part of when we hit the
syscall in Python.

Most syscalls return ``None`` to Python when they’ve been dealt with on
the Pytch side, usually after a suspension has ``resume()``\ ’d. (We
could explore other approaches, e.g., a broadcast could return to Python
the list of created threads.) The ‘is-touching’ syscall returns a Python
bool giving the answer to the is-touching question.

If a syscall itself throws a JavaScript error, that error is captured
and then eventually raised when the Python-level computation resumes.
This is achieved by the Pytch suspension storing the error, which is
then thrown in the suspension's ``resume()`` method.  See
``new_pytch_suspension()::resume()`` and ``Thread.one_frame()`` for
details.

We create a new type “Pytch” of Skulpt suspension. Use “subtype” to say
which syscall was invoked; add a new suspension property “subtype_data”
for any arguments the syscall requires.

DOC TODO: Adjective to distinguish the two types of syscall? Is there
also a distinction between syscalls which yield and those that don’t?

Many syscalls (DOC TODO: ‘all’?) replace the thread’s stored suspension
with the newly-created one, so that thread’s execution resumes from the
point it invoked the syscall.

Yield-until-next-frame
~~~~~~~~~~~~~~~~~~~~~~

Does nothing beyond storing the new suspension / continuation.

Broadcast / broadcast-and-wait
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Launches new thread group; ‘and-wait’ variant also. Thread invoking this
knows what project it’s part of (== parent project) and that project can
find handlers and launch their thread-groups.

Wait-seconds
~~~~~~~~~~~~

Just counts down frames.

Assumes 60 frames per second for all conversions.

TODO: Rest of syscalls
~~~~~~~~~~~~~~~~~~~~~~
