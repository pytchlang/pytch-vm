import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
)


class Ball(Sprite):
    Costumes = [('yellow-ball', 'library/images/ball.png', 8, 8)]


class Table(Stage):
    Backdrops = [('wooden', 'library/images/stage/wooden.png'),
                 ('white', 'library/images/stage/solid-white.png')]


project = Project()
project.register_sprite_class(Ball)
project.register_stage_class(Table)
