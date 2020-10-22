import pytch
from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
    when_I_receive,
    when_key_pressed,
)


class FlagClickCounter(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_clicks = 0

    @when_green_flag_clicked
    def note_click(self):
        self.n_clicks += 1
        pytch.wait_seconds(0)
        self.n_clicks += 1

    @when_I_receive('reset')
    def reset_n_clicks(self):
        self.n_clicks = 0

    @when_key_pressed('x')
    def forget_a_click(self):
        self.n_clicks -= 1


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(FlagClickCounter)
