Running many scripts at once
============================

Scripts under hat blocks usually run to completion when that script is
triggered, before the screen is updated.  The exceptions are:

* when an ‘and wait’ call is made, e.g., ``broadcast_and_wait()``;
* during a ``while`` or ``for`` loop: one iteration of the loop runs
  per display frame.

TODO: Other syscalls also suspend for a frame; check and document
this.

One consequence of this is that if you have a very complex piece of
processing inside an event handler, your project might appear to have
crashed.  Try to keep things simple!

(The information above about ``while`` and ``for`` loops is slightly
simplified.  See the :ref:`Threading Model<threading_model>` help if you would like to
know the full details, although most Pytch programs will not have to
worry about this.)
