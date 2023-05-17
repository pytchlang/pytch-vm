Integration with client
-----------------------

This section gives an overview of the typical usage of the VM, which
is to run a user’s Python program within the web-app.  Much of the
below also applies to running programs in the unit-test framework.

Set-up phase (building a user’s Python code)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The user’s program will have classes including various decorated
methods, for example methods decorated
``@pytch.when_green_flag_clicked``.  [[1]] Such a decorator attaches
an attribute to the function object, marking it as being a handler for
a particular kind of event.  This happens purely within the Python
world.

When the user clicks the green “play” button in the webapp, the user’s
code is imported using one of Skulpt’s entry points —
``Sk.importMainWithBody()``.  This gives us a ‘module’, and we then
process that module in various ways.  This happens in
``import_with_auto_configure()``.  If you strip away the
error-handling and other ancillary work, this process really consists
of two calls: ``Sk.importMainWithBody()`` and
``maybe_auto_configure_project()``.

(We keep a global reference to the current “live” project, which is an
object within the user’s imported module.  This keeps everything
alive.)

The auto-configure process looks through the module object for
subclasses of ``Sprite`` or ``Stage``.  For each, it creates a
JavaScript object to represent that ``Actor``.  The JS constructor of
that JS ``Actor`` includes a call to a JS method which registers the
event handlers.

[[2]] That method looks through the Python class for functions
(methods), and, if the any of the attributes mentioned at [[1]] above
exist, calls a JS method which adds the Python method to one of
various maps which track which methods of which classes should be
invoked when various events happen.  As an example, green-flag methods
are handled here by adding a handler object to a “green-flag handlers”
array-like object.

Now everything just sits there until an event happens.

Creating threads when an events happens
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

First some ``Threads`` are created:

The client (webapp or unit test framework) calls the current live
project’s ``on_green_flag_clicked()`` method.  The project iterates
over its ``Actor`` instances, each of which iterates over its
registered green-flag handlers.  All this eventually comes down to a
series of calls to ``ThreadGroup.create_thread()``, one per handler
per ``Sprite``/``Actor`` instance.

The first two arguments to ``create_thread()`` are the “Python
function” (which is the unbound method found when iterating over the
attributes of a class in [[2]] above) and the “Python argument” which
is the instance of the ``Sprite`` on which the ``Thread`` will run.
These are used to create a new ``Thread``.  These arguments are
captured [[3]] in a closure stored in the ``skulpt_susp`` slot of the
new ``Thread``.  The JS code in this closure will in due course invoke
the user’s Python code — ``Sk.misceval.callsimOrSuspend(py_callable,
py_arg)``.

So far we’ve only scheduled that ``Thread`` for running.  No user
Python code has run yet.

Running threads
~~~~~~~~~~~~~~~

Threads are run as follows:

Pytch scheduling is based around “frames” (as in animation or display
frames, not stack frames).  The application (webapp or unit test
framework) repeatedly calls ``Project.one_frame()``.  This (as well as
various housekeeping) calls ``one_frame()`` on each of its
``ThreadGroup`` instances, each of which in turn calls ``one_frame()``
on each of its ``Thread`` instances.

We finally reach the point where the user’s Python code runs:
``Thread.one_frame()``.

The nub of this method is a call to ``this.skulpt_susp.resume()``.
The first time a new thread runs, this (via the set-up in [[3]] above)
comes down to invoking the unbound Python method with the ``Sprite``
instance as argument, which is equivalent to calling that Python
method on that Python ``Sprite`` instance.  The rest of
``one_frame()`` deals with the three different cases that can happen
when running the user’s code.

User’s code runs to completion
  In this case, the thread has finished, becomes a zombie, and is
  reaped in due course.

User’s code invokes a “syscall”
  This means our Pytch VM has to do something (e.g., broadcast a
  message, start a sound playing).  In this case, we use Skulpt’s
  “suspension” mechanism (essentially a continuation) to allow
  resumption in a future call to ``one_frame()``.

User’s code raises a Python exception
  In this case, the client is notified of the exception and the thread
  put into a state indicating it raised an exception.

Summary
~~~~~~~

To boil this down to just the part which get a reference to the Python
callable within the user’s code and the part that invokes that code:

``Sk.importMainWithBody()`` returns a “module”, which we can look
through for Python callables (in our case, methods of classes of
interest).

``Sk.misceval.callsimOrSuspend()`` runs those Python callables with
arguments.
