from pytch.syscalls import (
    play_sound,
    registered_instances,
    wait_seconds,
)

from pytch.project import FRAMES_PER_SECOND


def _is_number(x):
    return isinstance(x, int) or isinstance(x, float)


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
            cls._appearance_names = [
                appearance.label for appearance in cls._Appearances
            ]

    def switch_appearance(self, appearance_name_or_index):
        self.ensure_have_appearance_names()

        if isinstance(appearance_name_or_index, str):
            appearance_name = appearance_name_or_index
            if appearance_name not in self._appearance_names:
                raise KeyError('could not find {} "{}" in class "{}"'
                               .format(self._appearance_hyponym,
                                       appearance_name,
                                       self.__class__.__name__))

            self._appearance_index = self._appearance_names.index(appearance_name)
        elif isinstance(appearance_name_or_index, int):
            appearance_index = appearance_name_or_index

            if appearance_index < 0:
                raise ValueError(
                    ('could not switch to {} number {} in class "{}":'
                     ' number can not be negative')
                    .format(self._appearance_hyponym,
                            appearance_index,
                            self.__class__.__name__))

            n_appearances = len(self._appearance_names)
            if appearance_index >= n_appearances:
                raise ValueError(
                    ('could not switch to {} number {} in class "{}":'
                     ' it only has {} {0}s')
                    .format(self._appearance_hyponym,
                            appearance_index,
                            self.__class__.__name__,
                            n_appearances))

            self._appearance_index = appearance_index
        else:
            raise ValueError(
                ('could not switch {} in class "{}":'
                 ' argument must be string or integer')
                .format(self._appearance_hyponym,
                        self.__class__.__name__))

    def next_appearance(self, n_steps):
        if not isinstance(n_steps, int):
            raise ValueError("n_steps must be integer")

        if len(self._Appearances) == 0:
            raise ValueError(
                ('could not move to next {} in class "{}":'
                 ' it has no {0}s')
                .format(self._appearance_hyponym, self.__class__.__name__)
            )

        self._appearance_index += n_steps
        self._appearance_index %= len(self._Appearances)

    @property
    def appearance_number(self):
        return self._appearance_index

    @property
    def appearance_name(self):
        self.ensure_have_appearance_names()
        return self._appearance_names[self._appearance_index]


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

        at_least_one_Costume = len(self._Appearances) != 0
        if hasattr(self, "start_shown"):
            if self.start_shown and not at_least_one_Costume:
                raise ValueError("start_shown is set,"
                                 " but there are no Costumes")
            self._shown = self.start_shown
        else:
            self._shown = at_least_one_Costume

        if at_least_one_Costume:
            self._appearance_index = 0
        else:
            # It is not necessarily an error to have no Costumes, as
            # long as the Sprite always remains hidden.  It might, for
            # example, only receive/broadcast messages or play sounds.
            self._appearance_index = None

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

    def glide_to_xy(self, destination_x, destination_y, seconds):
        destination_is_number = (
            _is_number(destination_x) and _is_number(destination_y)
        )
        if not destination_is_number:
            raise ValueError("destination coordinates must be numbers")

        if not _is_number(seconds):
            raise ValueError("'seconds' must be a number");
        if seconds < 0:
            raise ValueError("'seconds' cannot be negative")

        n_frames = max(int(seconds * FRAMES_PER_SECOND), 1)
        start_x = self._x
        start_y = self._y

        # On completion, we must be exactly at the target, and we want
        # the first frame to involve some movement, so count from 1 up
        # to n_frames (inclusive) rather than 0 up to n_frames - 1.
        for frame_idx in range(1, n_frames + 1):
            t = frame_idx / n_frames  # t is in (0.0, 1.0]
            t_c = 1.0 - t  # 'complement'
            x = t * destination_x + t_c * start_x
            y = t * destination_y + t_c * start_y
            self.go_to_xy(x, y)
            wait_seconds(0)  # No auto-yield (we don't do "import pytch")

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

    def next_costume(self, n_steps=1):
        self.next_appearance(n_steps)

    @property
    def costume_number(self):
        return self.appearance_number

    @property
    def costume_name(self):
        return self.appearance_name

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

    _appearance_hyponym = 'Backdrop'

    def __init__(self):
        if not self.Backdrops:
            # In contrast to Sprites, a Stage is always shown and so
            # must have at least one Backdrop.
            raise ValueError('no Backdrops in Stage')

        self._appearance_index = 0

    @classmethod
    def the_only(cls):
        return registered_instances(cls)[0]

    def switch_backdrop(self, backdrop_name):
        self.switch_appearance(backdrop_name)

    def next_backdrop(self, n_steps=1):
        self.next_appearance(n_steps)

    @property
    def backdrop_number(self):
        return self.appearance_number

    @property
    def backdrop_name(self):
        return self.appearance_name
