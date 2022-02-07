import pytch
from pytch import (
    Sprite,
    Project,
    when_green_flag_clicked,
    when_I_receive,
)


class T1(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.counter = 0

    @when_green_flag_clicked
    def start_counting(self):
        self.counter = 0
        while True:
            self.counter += 1


class T2(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.counter = 0

    @when_green_flag_clicked
    def start_counting(self):
        self.counter = 0
        while True:
            self.counter += 1


class Controller(Sprite):
    @when_I_receive("halt")
    def stop_everything(self):
        pytch.stop_all()


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(T1)
project.register_sprite_class(T2)
project.register_sprite_class(Controller)
