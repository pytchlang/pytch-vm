import pytch
from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
    when_I_receive,
)


class FlagClickCounter(Sprite):
    def __init__(self):
        self.n_clicks = 0

    @when_green_flag_clicked
    def note_click(self):
        self.n_clicks += 1
        pytch.yield_until_next_frame()
        self.n_clicks += 1

    @when_I_receive('reset')
    def reset_n_clicks(self):
        self.n_clicks = 0


project = Project()
project.register_sprite_class(FlagClickCounter)
