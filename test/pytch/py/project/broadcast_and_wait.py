import pytch
from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
    when_I_receive,
)


class Sender(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_steps = 0

    @when_green_flag_clicked
    def send_message(self):
        self.n_steps += 1
        pytch.broadcast_and_wait('something-happened')
        self.n_steps += 1


class Receiver(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_events = 0

    @when_I_receive('something-happened')
    def note_event(self):
        self.n_events += 1
        pytch.yield_until_next_frame()
        self.n_events += 1


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Sender)
project.register_sprite_class(Receiver)
