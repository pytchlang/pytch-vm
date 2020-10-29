Overview
--------

-  Skulpt provides the bridge between Python and JavaScript. A “Python
   object” exists as a particular kind of JavaScript object.

-  One running instance of a Pytch program is represented by a
   ``Project``; in the web-app, there is only one ‘live’ ``Project`` at
   a time.

-  A Scratch-like Sprite is represented by a user-written Python class
   derived from a Pytch-supplied base class; instances of the user’s
   classes represent the interacting elements of a ``Project``.

-  A JavaScript-side ``Project`` has a collection of ``PytchActor``
   objects, each representing such a Python class which has been
   registered with the ``Project``.

-  Every ``PytchActor`` has at least one ``PytchActorInstance``, each
   corresponding to a Python instance of the corresponding class;
   instances can be created and registered with the ``Project``; all but
   the original instance can be de-registered from the ``Project``.

-  Program execution happens via the ``Project`` maintaining a
   collection of ``Thread``\ s, organised into ``ThreadGroup``\ s; each
   ``Thread`` is ‘running on’ some ``PytchActorInstance``.

-  ``ThreadGroup``\ s are launched in response to events; ``Thread``\ s
   are created to run ``Handler``\ s; the user declares ``Handler``\ s
   using Python decorator syntax.

-  Some events apply to all instances of an actor; some just to a
   particular instance. Some are exogenous; some endogenous.

-  Invoking a ``Handler`` consists of making a call to some Python
   method of some ``Sprite``- or ``Stage``-derived class, bound to some
   instance of that class.

-  A ``Thread`` can be ‘running’; or it can be ‘waiting’/’sleeping’
   until some ‘wake’ condition holds; or it can have terminated.

-  Pytch system calls provide services requiring support from the Pytch
   runtime, such as the broadcast mechanism, which can launch new
   thread-groups.

-  Multi-threading is (sometimes implicitly) cooperative; execution
   proceeds in ‘frames’ (using that term as in animation); every frame,
   each running thread executes until it either finishes or cedes
   control back to the Pytch runtime.

-  When a thread cede control, its continuation is captured as Skulpt
   suspension.

-  To achieve some implicit cooperation, ‘cede control’ calls are
   inserted by the Skulpt/Pytch compiler in for and while loops. Most
   system calls also implicitly cede control.

-  Cross-actor communication is done by broadcasting and receiving
   string messages.

-  All the above is decoupled from the browser, to allow easier testing;
   the handful of dependencies are configured as mocks; testing is then
   done in JavaScript (using node) on the behaviour of small Pytch
   programs.

-  For Scratch-like interactive use, there is a web-app which configures
   the Pytch dependencies to interact with the browser; it allows the
   user to enter code, save/load their work, or load Pytch-supplied
   examples.

-  The web-app runs threads and renders the current state of the live
   ``Project`` at a nominal 60fps; each ``Actor`` instance has an
   ‘appearance’, location, and size, and can be hidden or shown. The
   web-app supports sound, and approximate click- and
   collision-detection.
