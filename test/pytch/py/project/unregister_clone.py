import pytch
from pytch import (
    Sprite,
    Project,
    when_I_start_as_a_clone,
    when_I_receive,
)


class Beacon(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_clone_reqs = 0
        self.is_the_original = 'yes'

    @when_I_start_as_a_clone
    def note_not_original(self):
        self.is_the_original = 'no'

    @when_I_start_as_a_clone
    def keep_pinging(self):
        while True:
            pytch.broadcast_and_wait('ping')

    @when_I_receive('create-clone')
    def create_clone(self):
        self.n_clone_reqs += 1
        pytch.create_clone_of(self)

    @when_I_receive('destroy-clones')
    def self_destruct(self):
        self.delete_this_clone();


class Counter(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_pings = 0

    @when_I_receive('ping')
    def count_ping(self):
        self.n_pings += 1


project = Project()
project.register_sprite_class(Beacon)
project.register_sprite_class(Counter)
