import pytch
from pytch import (
    Stage,
    Sprite,
    Project,
    when_this_sprite_clicked,
    when_stage_clicked,
)


class Banana(Sprite):
    Costumes = [('yellow', 'library/images/yellow-banana.png', 50, 30)]

    @when_this_sprite_clicked
    def say_hello_banana(self):
        print('hello from Banana')


class Table(Stage):
    Backdrops = [('wooden', 'library/images/stage/wooden.png')]

    @when_stage_clicked
    def say_hello_table(self):
        print('hello from Table')


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Banana)
project.register_stage_class(Table)
