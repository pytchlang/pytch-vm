Web-app
-------

Provides interactive system for developing Pytch applications.

Relies on the following, as well as on Skulpt:

-  jQuery
-  the Ace editor
-  jquery-dropdown

Bulk of work is done by the Pytch runtime, including its Skulpt base.
The job of the web-app is to provide the Skulpt/Pytch API dependency
points (e.g., keyboard, async-load-image).

Rendering: done via an HTML5 canvas.

Keyboard: very similar to mock keyboard except needs to prevent default
handling of key events in Pytch canvas.

Tracks ‘current live project’, i.e., the one which is actually being
rendered to the canvas and receives keyboard etc events. Get new ‘live
project’ as part of boilerplate at the end of a Pytch program which does
go_live(), which happens on ‘build’. Each import-as-main done on the
code (with its boilerplate) creates a new Project object; previous
live-project is ‘cut loose’ to float off into garbage; its
continuations/suspensions are never resume()d so nothing happens. On
first load, have a do-nothing project implementing same interface.

Changed indicator
~~~~~~~~~~~~~~~~~

Any edit brings up ‘your code changed’ msg; goes away on build. Not
intelligent; if you insert a character then delete it again, it still
thinks code has “changed”.

Examples
~~~~~~~~

Fetch into current editor. Populate menu on load of web-app from
hard-coded list. (Could be done as a separate file or sth if this gets
unwieldy.)

Save/load
~~~~~~~~~

Via browser local storage. Single-level flat ‘filesystem’.

Interaction with examples
^^^^^^^^^^^^^^^^^^^^^^^^^

Loading an example suggests ‘My X’ as project name for saving.

Stdout and errors
~~~~~~~~~~~~~~~~~

Python output / errors are collected into panels. (Skulpt has no
‘sys.stderr’.)

Go / stop buttons
~~~~~~~~~~~~~~~~~

Green-flag and red-stop click targets. Feed events into live-project’s
API points.

Building project
~~~~~~~~~~~~~~~~

Executes the user’s program as new ‘main’ module. Expected to interact
with the Pytch / Skulpt runtime via setting the ‘current live project’.

Stage canvas
~~~~~~~~~~~~

One object; knows how to render ‘put image’ instructions. Passes key
events it receives on to the ‘browser keyboard’ which in turn is what’s
used as ‘keyboard’ dependency of Skulpt/Pytch API.

Annoying coordinate transform needed to cope with Scratch’s
(mathematically sensible) coord frame vs computer-graphics-style canvas
coord frame.

Global state lifecycle
~~~~~~~~~~~~~~~~~~~~~~

(DOC TODO: Better name for this section.)

When class registered, one ‘original’ instance created. Instance-0. Any
state in those objects persists across external events such as
green-flag, red-stop.
