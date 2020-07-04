import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
    when_I_start_as_a_clone,
    when_I_receive,
)


G_next_global_id = 99
def next_global_id():
    global G_next_global_id
    G_next_global_id += 1
    return G_next_global_id


class Galaxies(Stage):
    def __init__(self):
        Stage.__init__(self)
        self.generated_id = 42


class Alien(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.generated_id = next_global_id()
        self.show()

    @when_I_start_as_a_clone
    def get_fresh_id(self):
        self.generated_id = next_global_id()

    @when_I_receive('clone-self')
    def clone_self(self):
        pytch.create_clone_of(self)

    @when_I_receive('hide-if-lt-102')
    def hide_if_lt_102(self):
        if self.generated_id < 102:
            self.hide()


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
project.register_stage_class(Galaxies)
