import pytch
from pytch import (
    Stage,
    Sprite,
    Project,
)


class Banana(Sprite):
    Costumes = [('yellow', 'library/images/yellow-banana.png', 50, 30)]


class Table(Stage):
    Backdrops = [('wooden', 'library/images/stage/wooden.png')]


project = Project()
project.register_sprite_class(Banana)
project.register_stage_class(Table)
