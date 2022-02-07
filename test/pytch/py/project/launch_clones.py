import pytch
from pytch import (
    Sprite,
    Project,
    when_I_start_as_a_clone,
    when_I_receive,
)


G_next_global_id = 99
def next_global_id():
    global G_next_global_id
    G_next_global_id += 1
    return G_next_global_id


class Alien(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.copied_id = 42
        self.generated_id = next_global_id()

    @when_I_start_as_a_clone
    def update_id(self):
        self.copied_id += 1
        self.generated_id = next_global_id()

    @when_I_receive('clone-self')
    def clone_self(self):
        pytch.create_clone_of(self)


class Broom(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.copied_id = 1

    @when_I_start_as_a_clone
    def update_id(self):
        self.copied_id += 1
        if self.copied_id < 5:
            pytch.create_clone_of(self)

    @when_I_receive('clone-self')
    def clone_self(self):
        pytch.create_clone_of(self)

    @when_I_receive('destroy-broom-clones')
    def self_destruct(self):
        self.delete_this_clone()


class Controller(Sprite):
    @when_I_receive("halt")
    def stop_everything(self):
        pytch.stop_all()


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
project.register_sprite_class(Broom)
project.register_sprite_class(Controller)
