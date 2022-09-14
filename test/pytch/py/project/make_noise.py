import pytch
from pytch import (
    Sprite,
    Project,
    when_I_receive,
    when_I_start_as_a_clone,
)


class Band(Sprite):
    Sounds = [('trumpet', 'trumpet.mp3'),
              ('violin', 'violin.mp3')]

    @when_I_receive("band-setup")
    def init(self):
        self.set_sound_volume(0.25)
        self.is_clone = False
        pytch.create_clone_of(self)

    @when_I_receive("band-play")
    def play_instruments(self):
        self.start_sound("trumpet" if self.is_clone else "violin")

    @when_I_receive("band-quiet")
    def quiet(self):
        self.set_sound_volume(0.5)

    @when_I_start_as_a_clone
    def clone_init(self):
        self.is_clone = True
        self.set_sound_volume(1.0)


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
project.register_sprite_class(Band)
project.register_sprite_class(Orchestra)
