import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
    when_green_flag_clicked,
    when_I_receive,
    when_this_sprite_clicked,
)


class Stage(Stage):
    Backdrops = ["solid-white-stage.png"]


class Balloon(Sprite):
    Costumes = [('balloon', 'balloon.png', 25, 25)]

    def __init__(self):
        Sprite.__init__(self)
        self.score = 0

    @when_green_flag_clicked
    def play_game(self):
        self.score = 0
        self.go_to_xy(-50, -120)
        self.switch_costume('balloon')
        self.show()

    @when_I_receive('reappear')
    def reappear(self):
        self.show()

    @when_I_receive('move')
    def move_to_other_place(self):
        self.go_to_xy(100, 100)
        self.show()

    @pytch.when_this_sprite_clicked
    def pop(self):
        self.hide()
        self.score += 1


# --cut-here-for-auto-config--

project = Project()
project.register_stage_class(Stage)
project.register_sprite_class(Balloon)
