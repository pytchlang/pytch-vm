from pytch.syscalls import (
    play_sound,
    registered_instances,
    wait_seconds,
)


class Actor:
    Sounds = []
    _appearance_names = None

    def start_sound(self, sound_name):
        play_sound(self, sound_name, False)

    def play_sound_until_done(self, sound_name):
        play_sound(self, sound_name, True)

    @classmethod
    def ensure_have_appearance_names(cls):
        if cls._appearance_names is None:
            cls._appearance_names = set(
                appearance.label for appearance in cls._Appearances)

    def switch_appearance(self, appearance_name):
        self.ensure_have_appearance_names()

        if appearance_name not in self._appearance_names:
            raise ValueError('could not find {} "{}" in class "{}"'
                             .format(self._appearance_hyponym,
                                     appearance_name,
                                     self.__class__.__name__))

        self._appearance = appearance_name


class Sprite(Actor):
    Costumes = [
        ('question-mark',
         'question-mark.png', 16, 16),
    ]

    _appearance_hyponym = 'Costume'

    def __init__(self):
        self._x = 0
        self._y = 0
        self._size = 1.0
        self._speech = None
        self._shown = len(self._Appearances) != 0
        if self._shown:
            self.switch_costume(self._Appearances[0].label)
        else:
            # It is not necessarily an error to have no Costumes, as
            # long as the Sprite always remains hidden.  It might, for
            # example, only receive/broadcast messages or play sounds.
            # We directly set the attribute here to avoid the check in
            # switch_appearance().
            self._appearance = None

    @classmethod
    def the_original(cls):
        return registered_instances(cls)[0]

    @classmethod
    def all_clones(cls):
        return registered_instances(cls)[1:]

    @classmethod
    def all_instances(cls):
        return registered_instances(cls)

    def go_to_xy(self, x, y):
        self._x = x
        self._y = y

    def get_x(self):
        return self._x

    def set_x(self, x):
        self._x = x

    def change_x(self, dx):
        self._x += dx

    def get_y(self):
        return self._y

    def set_y(self, y):
        self._y = y

    def change_y(self, dy):
        self._y += dy

    def set_size(self, size):
        self._size = size

    def show(self):
        if not self.Costumes:
            # See comment in __init__().
            raise RuntimeError('cannot show a Sprite with no Costumes')
        self._shown = True

    def hide(self):
        self._shown = False

    def switch_costume(self, costume_name):
        self.switch_appearance(costume_name)

    def touching(self, target_class):
        return (self._pytch_parent_project
                .instance_is_touching_any_of(self, target_class))

    def delete_this_clone(self):
        self._pytch_parent_project.unregister_actor_instance(self)

    def move_to_front_layer(self):
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "absolute", -1))

    def move_to_back_layer(self):
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "absolute", 0))

    def move_forward_layers(self, n_layers):
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "relative", n_layers))

    def move_backward_layers(self, n_layers):
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "relative", -n_layers))

    def say(self, content):
        self._speech = ("say", content)

    def say_nothing(self):
        self._speech = None

    def say_for_seconds(self, content, seconds):
        self.say(content)
        wait_seconds(seconds)
        self.say_nothing()


class Stage(Actor):
    Backdrops = [('solid-white', 'solid-white-stage.png')]
    _x = 0
    _y = 0
    _size = 1.0
    _shown = True
    _speech = None
    _appearance = 'solid-white'

    _appearance_hyponym = 'Backdrop'

    def __init__(self):
        if not self.Backdrops:
            # In contrast to Sprites, a Stage is always shown and so
            # must have at least one Backdrop.
            raise ValueError('no Backdrops in Stage')

        self.switch_backdrop(self._Appearances[0].label)

    @classmethod
    def the_only(cls):
        return registered_instances(cls)[0]

    def switch_backdrop(self, backdrop_name):
        self.switch_appearance(backdrop_name)
