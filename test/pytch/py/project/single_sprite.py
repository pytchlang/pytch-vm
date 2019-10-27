from pytch import (
    Project,
    Sprite,
)


class FlagClickCounter(Sprite):
    def __init__(self):
        self.n_clicks = 0


project = Project()
project.register_sprite_class(FlagClickCounter)
