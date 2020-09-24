import pytch
from pytch import (
    Sprite,
    Project,
    when_I_receive,
)


class Orchestra(Sprite):
    Sounds = [('trumpet', 'trumpet.mp3'),
              ('violin', 'violin.mp3')]

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

    @when_I_receive('play-both')
    def play_both(self):
        self.played_both = 'no'
        self.start_sound('trumpet')
        self.played_both = 'nearly'
        self.play_sound_until_done('violin')
        self.played_both = 'yes'

    @when_I_receive('silence')
    def silence(self):
        pytch.stop_all_sounds()


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Orchestra)
