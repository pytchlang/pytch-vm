import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
    when_green_flag_clicked,
    when_this_sprite_clicked,
)

import random

# Click the balloons to pop them and score points


class BalloonStage(Stage):
    Backdrops = [('midnightblue', 'library/images/stage/solid-midnightblue.png')]

    # TODO: Improve how using a non-default backdrop works.
    def __init__(self):
        Stage.__init__(self)
        self.switch_backdrop('midnightblue')


class Balloon(Sprite):
    Costumes = [('balloon', 'library/images/balloon.png', 50, 80)]

    def __init__(self):
        Sprite.__init__(self)
        self.score = 0

    def go_to_random_spot(self):
        self.go_to_xy(random.randint(-200, 200),
                      random.randint(-150, 150))

    @when_green_flag_clicked
    def play_game(self):
        self.score = 0
        self.go_to_random_spot()
        self.switch_costume('balloon')
        self.show()
        while True:
            pytch.wait_seconds(3.0)
            self.go_to_random_spot()
            self.show()

    @when_this_sprite_clicked
    def pop(self):
        self.hide()
        self.score += 1


project = pytch.Project()
project.register_stage_class(BalloonStage)
project.register_sprite_class(Balloon)
project.go_live()
