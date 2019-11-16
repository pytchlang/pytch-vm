import pytch
from pytch import (
    Sprite,
    Project,
    when_I_receive,
)


class Orchestra(Sprite):
    Sounds = [('trumpet', 'library/sounds/trumpet.mp3'),
              ('violin', 'library/sounds/violin.mp3')]


project = Project()
project.register_sprite_class(Orchestra)
