import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
)


class Ball(Sprite):
    Costumes = [('yellow-ball', 'library/images/ball.png', 8, 8)]

    def __init__(self):
        Sprite.__init__(self)
        self.go_to_xy(100, 50)
        self.switch_costume('yellow-ball')
        self.show()

    @when_green_flag_clicked
    def move(self):
        self.change_x(50)


project = Project()
project.register_sprite_class(Ball)
