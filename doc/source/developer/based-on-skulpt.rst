Skulpt: Python / JavaScript bridge
----------------------------------

In the below we sometimes talk about a “Python object”. In one sense,
that object is also a “JavaScript object”, because everything is a
JavaScript object within Skulpt. When we describe something as a “Python
object”, we are concentrating on its Python-world existence.

A fairly large inner core of Pytch is independent of the particular
requirements of the Scratch-like world of animated and interacting
Sprites. There is a reasonably general event-driven concurrency
mechanism in there, which could perhaps be adapted to other domains.

Skulpt / Python module ``pytch``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

From the Python point of view, all Pytch functionality is available
within a ``pytch`` module. For organisational purposes, there are
various submodules, but everything is also available at top level for
ease of use. Some names (e.g., those of hat-block decorators) are
intended to be imported into the user’s program’s namespace; others
seemed cleaner left as ``pytch.something``.
