Defining backdrops
==================

For the Stage, the normal way to specify a Backdrop is to just give
the filename of the file you have added to your project.  For example,

.. code-block:: python

   import pytch

   class Sky(pytch.Stage):
       Backdrops = ["night.jpg", "day.jpg"]

will give you a Stage having backdrops you can switch to with
``self.switch_backdrop("night")`` or ``self.switch_backdrop("day")``.
Because Backdrops always cover the whole Stage, there is no concept of
an origin for Backdrops.  You can, though, specify a label, for
example,

.. code-block:: python

   import pytch

   class Table(pytch.Stage):
       Backdrops = [
           ("wooden", "wooden-table.jpg"),
           ("metal", "metal-table.jpg"),
       ]

