Testing
-------

Unit testing is mostly done through Python examples, driven a frame at
a time.  Initially, unit tests were written with each test having its
Python code in a separate file, but more recently-written tests have
the Python code inline via a multi-line template literal.

A typical pattern is to set up a Pytch program, send various events to
it (perhaps green-flag or message broadcasts), calling ``one_frame()``
on the project and making assertions about the state of the project or
its sprites.

A mock keyboard and mouse are available, with the Skulpt/Pytch VM
configured to use them via a dependency bundle (described under
:doc:`Skulpt API / Pytch environment <./skulpt-pytch-environment>`).


Documentation for testing
~~~~~~~~~~~~~~~~~~~~~~~~~

This is currently quite sparse, but hopefully it will be helpful to
look at existing unit test code for examples close to what you are
trying to do.


Running the unit tests
~~~~~~~~~~~~~~~~~~~~~~

To run the tests, use the following:

.. code-block:: bash

   # Starting in repo root of pytch-vm
   cd test/pytch
   ./run-tests.sh

That script runs ``mocha`` (with the ``--parallel`` flag), and so its
options can be used.  For instance, to only run tests whose
description matches a regexp:

.. code-block:: bash

   ./run-tests.sh -g 'string|sound'
