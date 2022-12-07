Physical computing
------------------

Communication between VM and "GPIO interface device" is via two API
points within ``Sk.pytch.gpio_api``:

``send_message: (message: str) ⇒ void``
  Send the given *message* to the GPIO server.  Details of what a
  *message* is are below.

``acquire_responses: () ⇒ Array<Response>``
  Retrieve and take ownership of a list of whatever *responses* have
  arrived from the server since the last time ``acquire_responses()``
  was called.  (Or, if this is the first call, a list of all
  *responses* which have arrived from the server.)

Communication between VM and server
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Message
  List of *commands* (if the message is from client to server) or
  *responses* (if the message is from server to client)

Command
  A *sequence number* and an *operation*.

Response
  A *sequence number* and an *outcome*.

Sequence number
  Non-zero integer assigned by the client in commands sent to server.
  In responses, the sequence number indicates which command the
  response is a response to.  The server can also send "responses"
  with a seqnum of zero, which are unsolicited notifications from the
  server to the client.

Operation / Outcome
  Details of what the command is asking the server to do, or what the
  server is telling the client.

Commands and Responses
~~~~~~~~~~~~~~~~~~~~~~

To avoid pointless nesting, the seqnum and the contents of the
operation/outcome are in the same JSON object.

As such, a *command* or *response* always has the properties:

``seqnum: number`` (must be integer)
  In a command, a non-zero value chosen by the client so it can
  identify the response to that command.  In a response, the seqnum of
  the command to which it is responding.  It is also allowed for a
  response to have a seqnum of zero, which means it's unsolicited;
  currently this only happens for a report of a change of input level.

``kind: string``
  In a command, one of:

  * ``"reset"``
  * ``"set-input"``
  * ``"set-output"``

  In a response, one of:

  * ``"ok"``
  * ``"error"``
  * ``"report-input"`` (can be unsolicited)

Depending on ``kind``, a command or response has other properties:

Command ``reset``
  Tell the server to set all GPIOs to their default configuration.
  Typically this means all GPIOs will be inputs.  The response to a
  ``reset`` is typically ``ok``, although ``error`` is also possible.

Command ``set-input``
  Tell the server to set a particular pin as an input, pulled in a
  particular direction (or not at all).  Required properties:

  ``pin: number`` (must be an integer)
    Which pin to make an input.

  ``pullKind: string``
    Whether the input should be pulled up or down or not at all.
    Valid values:

    * ``"pull-up"``
    * ``"pull-down"``
    * ``"no-pull"``

  The response to a ``set-input`` command is normally a
  ``report-input`` response, giving a fresh reading of the level of
  the pin.  An ``error`` response is also possible.

Command ``set-output``
  Tell the server to make a particular pin be an output, and
  immediately set its level.  Required properties:

  ``pin: number`` (must be an integer)
    Which pin to make an output.

  ``level: number`` (must be either the integer 0 or the integer 1)
    Whether to set the pin to logic low or high.  Values:

    * ``0`` — set the pin to logic low
    * ``1`` — set the pin to logic high

    The response to a ``set-output`` command is normally an ``ok``
    response.  An ``error`` response is also possible.

Response ``ok``
  A ``reset`` or ``set-output`` command was executed successfully.

Response ``error``
  A command could not be executed successfully.  Human-readable detail
  in ``errorDetail``, which (as a requirement on the server) should
  contain all context required to know what happened.  E.g., ``bad
  pull-kind "blah" when trying to set pin 3 as input`` not bare ``bad
  pull-kind``.

Response ``report-input``
  Tell the client that pin ``pin`` has just been read and is at level
  ``level``.  Can be response to ``set-input`` command, or
  unsolicited, usually on change of a pin's level.  Can be sent *at
  any time*.

Pytch-level syscalls
~~~~~~~~~~~~~~~~~~~~

New syscalls.  Some have to be blocking because we need to wait for
response from server.

``set_gpio_as_input(pin, pull_kind)``
  Blocks until a response has been received to the command requesting
  this operation.  Returns ``None`` if successful, or throws an
  exception if something went wrong.  The ``pull_kind`` arg should be
  a string, one of the same values as for ``set-input`` command above.

``gpio_level(pin)``
  Immediately (no blocking, no yielding) returns the last-received
  level of that pin.  Error if that pin is not set as an input.
  **OR** should reading ``gpio_level()`` on an output pin return the
  last-request-set level on that pin?  TODO: Label as "waiting to set
  as input" and block the call if so, rather than giving error?  Might
  be friendlier?  Or OK to get people to do set-up in green-flag, then
  after set-up, bcast "go" message?  Leave as "maybe TODO".  Have
  another pin-state which is -2 for "request pending to set as input"?
  If ``gpio_level()`` finds pin-state is -1 (for undef), give a grace
  period of a few frames for setting as input or output?

``set_gpio_to_output(pin, level)``
  Set the given pin to output, and drive it to given level.
  Immediately returns.  TODO: Should this block until it's done?  Went
  for immediate return, otherwise turning on multiple LEDs could have
  noticeable delay from first to last.  And also a timed loop to flash
  an LED four times a second will be a bit off if there's a blocking
  call.  Downside is if error is thrown, the thread it was thrown on
  might not even exist any more.

TODO: Clarify whether it's OK to do ``gpio_level(pin)`` if ``pin`` has
been set to output.  Think it probably should be allowed.  Then
``set_gpio_to_output()`` should probably immediately optimistically
update the "shadow" pin level array under the assumption that the
command will succeed.

All syscalls which send commands to server actually collect those
commands in a ``GpioCommandQueue`` object belonging to the ``Project``.
At end of each frame, the commands are combined into a message and
sent.

TODO: Could be annoying to set multiple pins as inputs if each call
blocks.  How long does it take to get a response typically?  Add a
not-meant-for-end-users module variable
pytch.n_frames_since_green_flag which lets us do crude timing
measurements in Pytch programs?  Did this; early experiments suggests
response time is next-frame, which is probably OK.

Eg if one handler calls ``set_gpio_as_input()`` and another handler
calls ``gpio_level()`` on the same pin, the ``gpio_level()`` call will
probably fail because the set-as-input command may very well not have
completed.

Start-up sequence
~~~~~~~~~~~~~~~~~

To ensure a known start-up state, Project sends ``"reset"`` command
before it does anything else.  Tracks the progress/result of this in
property ``gpio_reset_state``.  At start of each frame, call
``do_gpio_reset_step()``, which controls the GPIO api until reset
successful.  Polls for matching response 30 times before concluding
failure.

Also need to send commands to set when-gpio-sees-edge inputs as
appropriately-pulled inputs.  Can we use the existing
Project.gpio_command_queue for this?  Think so.  All commands in it
will have has_thread_waiting = false for consistency.  We want to send
the reset first, and only when done do we want to send the set-input
commands.  So we need internally a list of lists of operations, which
will be

.. code-block:: javascript

   [
       // First do reset:
       [{ kind: "reset" }],

       // And then set all required pins to pulled inputs:
       [{ kind: "set-input", pin, pullKind },
        { kind: "set-input", pin, pullKind },
        ...,
        { kind: "set-input", pin, pullKind }],
   ]

Track this as "command-batch-queue" or similar.  Each time into
gpio-init-step, do:

If "not-started", construct above list and submit first batch (i.e.,
the one consisting just of the "reset" operation), and move to
"pending"; end.  If we can't construct the list (because of
inconsistency in pull-kinds requested for the same pin), throw an
error (which might mean sending one to Sk.pytch.on_exception).  Or do
we need an "could-not-start" or "error" state, separate from "failed"?

If "pending", invariant should be that gpio_command_queue is
non-empty.  Fetch and process responses.  (What about errors here?
Throw them?  Pass to Sk.pytch.on_exception?  Swallow but move to state
"failed"?  Maybe handle_gpio_responses() needs an additional "onError"
arg.)  If command-queue is now empty: If command-batch-queue is empty,
move to "done", otherwise enqueue and send all operations within the
next element of command-batch-queue (removing that elt), and stay in
"pending".

If "done" or "failed", do nothing.  (This matches current behaviour.)

After a call to gpio-init-step, we know state cannot be "not-started".


Integration with ``Project.one_frame()``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

At start of ``one_frame()``, deal with reset as above.  Assuming the
reset has already succeeded, proceed:

Acquire (via the API point) and dispatch received "responses",
including unsolicited notifications.  This might wake threads waiting
for a response to eg ``set_gpio_as_input()``.  Error responses might
generate an exception in a particular thread, or outside any thread
(because we fire-and-forget ``"set-output"`` commands).

TODO: Also launch handler threads for ``@pytch.when_gpio_changes(3,
pytch.LOW_TO_HIGH)``.

At end of ``one_frame()``, send any commands which threads have
enqueued for sending, bundled up into one message.

TODO: What to do with malformed messages arriving from server?  If
with a non-zero seqnum, could raise as exception at Python level, but
if seqnum is unknown or zero, no obvious "main" thread to raise the
exception in.  Could treat similarly to a rendering error?  Ideally
this is a "won't happen" situation because we control everything, but
should handle properly for diagnostics.


Testing
~~~~~~~

Mock GPIO interface.  Its ``send_message()`` just adds to a list of
pending commands.  Each call to ``acquire_received_messages()`` checks
to see which commands should have a response generated (which is after
a given ``latency``).  The mock also tracks the state of the pins.

It has an interface on the other side which allows tests to set the
level presented to an input pin and get the pin levels (as set by user
Pytch code doing ``set_gpio_as_output()``).

TODO: Scratch blocks use "to" not "as", e.g., "set GPIO 12 to output
HIGH".  This might be more natural language; if I've already set a
GPIO to an output, "set_gpio_as_output()" sounds odd.

.. note:: Below this point is notes-to-self.


Dev plan v2
~~~~~~~~~~~

Add frame_idx to project.  Not (yet?) exposed to Python so light
testing OK.

GpioCommandSet gpio_live_commands.  More/less as is.
handle_received_response: Early exit if seqnum 0.  Log/warn not error
on unk seqnum.  Do not call back to parent-project; strip
parent-project from class.

GpioCommand: more/less as is.  as_command_obj rename to
as_full_command_obj

one_frame():

Sk.pytch.gpio_api.acquire_responses() is new name.

dispatch_gpio_command_responses(): Send all to gpio_live_commands
(which will ignore 0-seqnum ones) then also send all to
handle_gpio_response_from_server() --- shorter name?  Just
"handle_gpio_response"?

Track whether any response generated an error; set flag if so.  Might
be outside any thread so can't just raise exception in that thread.
Is it only seqnum-0 "responses" which might lead to this?

Naming:

@pytch.when_gpio_is(pin, level)

pytch.gpio_is_high(pin)
pytch.gpio_is_low(pin)

pytch.set_gpio_to_output(pin, level)

pytch.set_gpio_to_input_pulled(pin, pullKind)

is what Scratch does.  Adapt slightly?  What words to use? "value"?
"level"?  Maybe "value" is more natural.  And it's what's used by the
sysfs interface, which people might have seen.  Can always change it
based on early user feedback.

pytch.set_gpio_as_input(pin, pullKind)
pytch.get_gpio_value(pin) -> 0 or 1
pytch.set_gpio_output(pin, value)
pytch.when_gpio_changes_to_value(pin, value)

Stages
~~~~~~

GPIO reset mechanism.  Mock ``gpio_api`` implementation which can be
constructed to succeed (and if so after how many calls) or fail at
reset: Write ``send_message`` and ``acquire_responses`` methods.
send-message checks whether "reset" and if so gets a response ready to
go after given number of frames; zero means immediately.

Implement "pytch.set_gpio_output(pin, level)" syscall.  Should see
command arrive at mock server.  Should be able to trigger exception in
Python code by returning error from server --- needs work on a way to
know whether an error will be raised as an exception inside a Pytch
thread, or if we have to raise it as a top-level "async error".  Add a
way to ask project whether it has outstanding live commands?  Trigger
exception by having gpio-reset fail.  Error?  It's fire/forget so by
the time error comes back, the thread which did the set_gpio_output()
might not even exist any more.  Maybe do need to bring in an
`on_warning()` top-level Sk.pytch event method?  Mark that TODO for
now since it brings in another whole piece.

Implement "pytch.set_gpio_as_input(pin, pullKind)" syscall.  New
thread state AWAITING_GPIO_RESPONSE, with cases in wake() and
should_wake().  Test with success and failure --- can test failure
here since should get exception in calling thread.  Designate some
pins in mock gpio-api as "will cause error if attempt to set to
input".

Implement "pytch.get_gpio_value(pin)" syscall.  Test gives error if
that pin not set to be an input.  Designate one pin in mock gpio-api
as "reads high when set to input" and one as "reads low when set to
input".

Implement report-level "unsolicited response" in mock-gpio-api.  Needs
method to drive input pin.  Test can see correct value from
get_gpio_value().

Real RPi loopback: Set both connected pins to input; the 'real' input
should then give whatever it's pulled to.  Can test pull-up/-down is
working.

Cypress testing: Have a WS server HardwareInterface which has
well-defined behaviour on some of its pins.  Something like: Pin 1
(output) is looped back to pin 2 (input); pin 3 (output) is looped
back with some known delay to pin 4 (input).  Pin 5 always reads high;
pin 6 always reads low.  Pin 7 gives error when set to input; pin 8
gives error when attempting to drive it as output.

Hat block responding to edges on GPIO inputs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Would like to support something like

.. code-block:: python

   @when_gpio_goes_high(pin_number, pull_kind)
   @when_gpio_goes_low(pin_number, pull_kind)

which are all edge-triggered.  Hopefully we can rely on the glitch
filter of ``pigpio`` to do debouncing.

Maybe pull-kind should be optional, with 'when goes high' defaulting
to pull-down, and 'when goes low' defaulting to pull-up.

How to ensure the relevant GPIOs are set as inputs?  What happens if
the user then tries to override them to outputs?

As part of the build and auto-configure process,
``Project.register_handler()`` is called for every method which is
marked as handling an event.  We could gather the requirements on GPIO
pins.  Handle inconsistent requirements; think only inconsistency
which might arise is if a pin is used with more than one different
pull-kind.

As part of ``do_gpio_reset_step()`` we could send the 'make these pins
be input' commands and block until all responses received.

Alternative is to make the user do ``set_gpio_as_input()`` calls at
top level, but that (a) is annoying for the user, and (b) would be
trickier to implement, since we have no ``Project`` at the point those
calls would run.
