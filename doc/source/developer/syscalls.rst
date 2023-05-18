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

Some syscalls can result from more than one Python-level function
call.  For example, the same syscall handles both ``broadcast()`` and
``broadcast_and_wait()`` functions, distinguishing between them via an
argument.

In the below list, the syscall label (“kind”) string is given,
followed by the user-level function/s which invoke it.

next-frame — ``yield_until_next_frame()``
  Pauses execution for this frame, but resumes immediately next time
  ``one_frame()`` runs.

broadcast — ``broadcast()``, ``broadcast_and_wait()``
  Launches new thread group for any methods handling the given
  message.  The ‘and-wait’ variant also marks the calling thread as
  awaiting-thread-group-completion.

play-sound — ``start_sound()``, ``play_sound_until_done()``
  Requests that the given sound be started.  For the
  ``play_sound_until_done()`` variant, puts the thread to sleep
  awaiting-sound-completion.

wait-seconds — ``wait_seconds()``
  Pauses execution for the given amount of time, converted into frames
  at 60fps.

register-instance — ``create_clone_of()``
  Adds the given Python instance to the Project, such that methods can
  be launched on it via Pytch events.

unregister-running-instance — ``delete_this_clone()``
  Removes the given Python instance from the Project.  It still exists
  as a Python object, but will no longer respond to Pytch events.

ask-and-wait-for-answer — ``ask_and_wait()``
  Requests that the given question be asked, and puts the thread to
  sleep awaiting-answer-to-question.

show-object-attribute — ``show_variable()``
  Add an attribute of an object to the list of “attribute watchers”;
  these report the the value of the given attribute back to the client
  each frame, as a rendering instruction.

hide-object-attribute — ``hide_variable()``
  Remove the attribute watcher corresponding to this object and
  attribute.

stop-all-threads — ``stop_all()``
  Programmatically press the “red stop” button.
