import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
    wait_seconds,
)


class Ball(Sprite):
    Costumes = [('ball', 'library/images/black-ball-16x16.png', 8, 8)]

    def __init__(self):
        Sprite.__init__(self)
        self.go_to_xy(100, 50)
        self.switch_costume('ball')
        self.show()

    @when_green_flag_clicked
    def move(self):
        self.change_x(50)
        wait_seconds(0.5)
        self.change_x(50)


project = Project()
project.register_sprite_class(Ball)
project.go_live()
