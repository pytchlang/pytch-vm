import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
)


class Ball(Sprite):
    Costumes = [('yellow-ball', 'ball.png', 8, 8)]


class Table(Stage):
    Backdrops = [('wooden', 'wooden-stage.png'),
                 ('white', 'solid-white-stage.png')]


project = Project()
project.register_sprite_class(Ball)
project.register_stage_class(Table)
