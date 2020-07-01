import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
    when_I_start_as_a_clone,
    when_I_receive,
    the_original,
    all_clones_of,
    all_instances_of,
)


G_next_global_id = 99
def next_global_id():
    global G_next_global_id
    G_next_global_id += 1
    return G_next_global_id


class Alien(Sprite):
    @when_green_flag_clicked
    def init(self):
        self.id = next_global_id()

    @when_I_receive('make-clones')
    def make_some_clones(self):
        pytch.create_clone_of(self)
        pytch.create_clone_of(self)
        pytch.create_clone_of(self)

    @when_I_start_as_a_clone
    def set_id(self):
        self.id = next_global_id()


class Scanner(Sprite):
    @when_green_flag_clicked
    def init(self):
        # Store the IDs rather than the actual Alien objects, because
        # the Sk.ffi.remapToJs() does not know how to handle Alien
        # instances.
        self.got_alien_ids = 0

    @when_I_receive('get-original')
    def get_original(self):
        self.got_alien_ids = the_original(Alien).id

    @when_I_receive('get-clones')
    def get_clones(self):
        self.got_alien_ids = sorted([a.id for a in all_clones_of(Alien)])

    @when_I_receive('get-instances')
    def get_instances(self):
        self.got_alien_ids = sorted([a.id for a in all_instances_of(Alien)])


project = Project()
project.register_sprite_class(Alien)
project.register_sprite_class(Scanner)
