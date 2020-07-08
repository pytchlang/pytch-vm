import pytch
from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
)


class Alien(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_steps = 0

    @when_green_flag_clicked
    def invade(self):
        self.n_steps += 1
        pytch.wait_seconds(0.25)
        self.n_steps += 1


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
