Broadcast the message ``message_string``, launching any scripts with a
matching ``@pytch.when_I_receive()`` decorator (hat-block).  The
script calling ``broadcast_and_wait()`` waits until all those
responding scripts have finished before continuing.
