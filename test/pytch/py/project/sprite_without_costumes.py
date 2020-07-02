import pytch
from pytch import (
    Sprite,
    Project,
    when_I_receive,
)


class InvisibleThing(Sprite):
    Costumes = []

    @when_I_receive('show-yourself')
    def try_to_show(self):
        self.show()


project = Project()
project.register_sprite_class(InvisibleThing)
