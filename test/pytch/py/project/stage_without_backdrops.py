import pytch
from pytch import (
    Stage,
    Project,
)


class InvisibleStage(Stage):
    Backdrops = []


project = Project()
project.register_stage_class(InvisibleStage)
