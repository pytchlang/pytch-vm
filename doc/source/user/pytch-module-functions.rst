Functions in the pytch module
=============================

TODO: Check and update the below list.

* ``pytch.wait_seconds(n_seconds)`` makes the script calling
  ``wait_seconds()`` do nothing for ``n_seconds`` seconds before
  resuming; currently this is done by counting frames, so complicated
  scripts which render at less than 60fps will wait for the wrong
  amount of time; fixing this is on the roadmap
* ``pytch.broadcast(message_string)`` broadcasts the message
  ``message_string``, launching any scripts with a matching
  ``@pytch.when_I_receive()`` decorator (hat-block); the script calling
  ``broadcast()`` continues, with the responses happening concurrently
* ``pytch.broadcast_and_wait(message_string)`` broadcasts the message
  ``message_string``, launching any scripts with a matching
  ``@pytch.when_I_receive()`` decorator (hat-block); the script
  calling ``broadcast_and_wait()`` waits until all those scripts have
  finished before continuing
* ``pytch.key_pressed(key_name)`` gives a true/false answer as to
  whether the key with name ``key_name`` is currently pressed
