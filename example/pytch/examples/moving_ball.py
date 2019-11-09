import pytch
from pytch import (
    Sprite,
    Project,
)


class Ball(Sprite):
    Costumes = [('ball', 'library/images/black-ball-16x16.png', 8, 8)]

    def __init__(self):
        Sprite.__init__(self)
        self.go_to_xy(100, 50)
        self.switch_costume('ball')
        self.show()


project = Project()
project.register_sprite_class(Ball)
project.go_live()
