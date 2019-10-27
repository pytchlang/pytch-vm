from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
)


class FlagClickCounter(Sprite):
    def __init__(self):
        self.n_clicks = 0

    @when_green_flag_clicked
    def note_click(self):
        self.n_clicks += 1


project = Project()
project.register_sprite_class(FlagClickCounter)
