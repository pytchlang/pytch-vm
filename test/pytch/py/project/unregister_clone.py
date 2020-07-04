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
        self.kept_running = 'no'

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
        self.counter = 0
        while True:
            self.counter += 1

    @when_I_receive('destroy-clones')
    def self_destruct(self):
        self.delete_this_clone();
        # For the "original" instance, the delete_this_clone() call should be
        # a no-op, so we should keep going.  The wait_seconds() call is to
        # test that we can get into the scheduler and back out again.
        pytch.wait_seconds(0.1)
        self.kept_running = 'yes'


class Counter(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_pings = 0

    @when_I_receive('ping')
    def count_ping(self):
        self.n_pings += 1


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Beacon)
project.register_sprite_class(Counter)
