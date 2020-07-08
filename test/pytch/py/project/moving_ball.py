import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
    when_I_receive,
    when_key_pressed,
    key_is_pressed,
)


class Ball(Sprite):
    Costumes = [('yellow-ball', 'library/images/ball.png', 8, 8)]

    def __init__(self):
        Sprite.__init__(self)
        self.keys_pressed = ''
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

    @when_I_receive('check-keys')
    def check_keys(self):
        self.keys_pressed = ''.join(kn for kn in 'abc' if key_is_pressed(kn))


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Ball)
