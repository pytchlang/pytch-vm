from pytch.syscalls import (
    play_sound,
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
                appearance[0] for appearance in cls._appearances())

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
         'library/images/question-mark.png', 16, 16),
    ]

    _appearance_hyponym = 'Costume'

    @classmethod
    def _appearances(cls):
        return cls.Costumes

    def __init__(self):
        self._x = 0
        self._y = 0
        self._size = 1.0
        self._shown = False
        self._appearance = 'question-mark'

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


class Stage(Actor):
    Backdrops = [('solid-white', 'library/images/stage/solid-white.png')]
    _x = 0
    _y = 0
    _size = 1.0
    _shown = True
    _appearance = 'solid-white'

    @classmethod
    def _appearances(cls):
        return cls.Backdrops

    _appearance_hyponym = 'Backdrop'

    def __init__(self):
        pass

    def switch_backdrop(self, backdrop_name):
        self.switch_appearance(backdrop_name)
