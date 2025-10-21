Make the script calling ``wait_seconds()`` do nothing for
``n_seconds`` seconds before resuming.  This is done by counting
frames, so complicated scripts which render at less than 60fps will
wait for the wrong amount of time; fixing this is on the roadmap.
