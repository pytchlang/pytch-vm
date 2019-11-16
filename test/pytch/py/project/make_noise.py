import pytch
from pytch import (
    Sprite,
    Project,
    when_I_receive,
)


class Orchestra(Sprite):
    Sounds = [('trumpet', 'library/sounds/trumpet.mp3'),
              ('violin', 'library/sounds/violin.mp3')]

    @when_I_receive('play-trumpet')
    def play_trumpet(self):
        self.played_trumpet = 'no'
        self.start_sound('trumpet')
        self.played_trumpet = 'yes'

    @when_I_receive('play-violin')
    def play_violin(self):
        self.played_violin = 'no'
        self.play_sound_until_done('violin')
        self.played_violin = 'yes'


project = Project()
project.register_sprite_class(Orchestra)
