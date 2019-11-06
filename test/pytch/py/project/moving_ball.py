import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
    when_key_pressed,
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
        pytch.wait_seconds(0.5)
        self.change_x(60)

    @when_key_pressed('w')
    def move_up(self):
        self.change_y(10)

    @when_key_pressed('s')
    def move_down_lots(self):
        self.change_y(-100)


project = Project()
project.register_sprite_class(Ball)
