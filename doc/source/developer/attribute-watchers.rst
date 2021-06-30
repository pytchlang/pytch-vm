Watching object attributes
--------------------------

Possible future change:

* Support ``self.show_variable("score")`` as shorthand for
  ``pytch.show_variable(self, "score")``.  Could then have
  ``pytch.show_variable("score")`` for module-level ``score``, backed
  by a renamed ``pytch._show_attribute()`` syscall.
