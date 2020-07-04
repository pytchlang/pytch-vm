import pytch
from pytch import (
    Project,
    Stage,
)


class Scenery(Stage):
    def __init__(self):
        Stage.__init__(self)
        self.colour = 'red'


# --cut-here-for-auto-config--

project = Project()
project.register_stage_class(Scenery)
