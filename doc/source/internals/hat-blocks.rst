Hat blocks
----------

This is how threads get launched in the first place. (Apart from code in
the ``__init__()`` of an Actor class, which runs when each ``Actor``\ ’s
instance-0 is created by Pytch.) As in Scratch, a section of code is
marked to indicate that the user wants it to be triggered when a certain
event occurs. In Pytch, this is done with Python decorators on the
methods.

The decorator itself just attaches an annotation to the function (at the
time of reading the class body, methods are just functions). This
annotation holds a list describing the decorators which have been used
on the function. Each descriptor is a pair (type, data); some types have
no data (green-flag); others do (receive, in which case data is message
string; keypress, key name).

At class registration time (register-sprite-class or -stage-), the
Project combs through the properties of the class object, looking for
functions which have the annotation. Pytch then maintains maps, to be
able to find which functions to call within which classes when a
particular event happens.

Some hat-blocks trigger for all instances of a ``Sprite``; some just for
an ‘affected’ instance (this-clicked, start-as-clone). A ‘handler’ knows
which ``Actor`` it is for, and which unbound method to run when the
event happens. This is used for all-instance events (e.g.,
when-I-receive). More than one method can be decorated for the same
event, so Pytch gathers event-handlers into an event-handler-group. A
(JavaScript-side) ``PytchActor`` object stores a map from event to the
corresponding handler-group.

DOC TODO: Green flag vs when-I-recv vs clone; where are these event
handler maps stored?

Launching threads from event
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When an event occurs: The handler creates a thread per instance of the
class; the handler-group gathers all such threads for all its contained
handlers. The ``Project`` gathers all such threads across all its
registered actors. The result is a ‘thread group’: a collection of
threads all launched in response to the same event. The Project
maintains a list of ‘live’ thread-groups. (DOC TODO: Better word than
‘live’? Means ‘at least one non-zombie thread’.)

An event can be exogenous (keypress, green-flag) or endogenous
(broadcast — although for testing have ability to exogenously do
broadcast).

Pytch does not immediately launch threads on a keypress or mouse click.
These events are stored in a queue, and then processed at the start of
each frame. It simplifies the testing slightly to have the main
one-frame code pull new events from the keyboard and mouse.

Generation of events
~~~~~~~~~~~~~~~~~~~~

Exogenous events:

-  Green flag click has explicit entry point in Project,
   on_green_flag_clicked()

-  when-I-receive: also message string; stored as map with message
   string as key.

-  Keypresses: stored in a ‘keyboard’ and drained at the start of each
   frame

-  Mouse clicks: likewise
