from pytch.syscalls import (
    play_sound,
    registered_instances,
    wait_seconds,
    ask_and_wait,
)

from pytch.project import FRAMES_PER_SECOND

import pytch._glide_easing as glide_easing

# Close enough:
MATH_PI = 3.141592653589793


def _is_number(x):
    return isinstance(x, int) or isinstance(x, float)


class _IdGenerator:
    def __init__(self):
        self.id = 40000

    def __call__(self):
        self.id += 1
        return self.id

# Ensure that each individual utterance is uniquely identifiable.
# This allows say_for_seconds() to only erase the current utterance if
# it's the utterance which that invocation of say_for_seconds() put
# there.
_new_speech_id = _IdGenerator()


class Actor:
    Sounds = []
    _appearance_names = None

    def start_sound(self, sound_name):
        "(SOUND) Start SOUND playing; continue running"
        play_sound(self, sound_name, False)

    def play_sound_until_done(self, sound_name):
        "(SOUND) Play SOUND; pause until it finishes playing"
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
    "The starting class for all your sprites"

    Costumes = [
        ('question-mark',
         'question-mark.png', 16, 16),
    ]

    _appearance_hyponym = 'Costume'

    def __init__(self):
        self._x = 0
        self._y = 0
        self._rotation = 0.0
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
        "() Return the original Sprite instance"
        return registered_instances(cls)[0]

    @classmethod
    def all_clones(cls):
        "() Return a list of all clones of this Sprite"
        return registered_instances(cls)[1:]

    @classmethod
    def all_instances(cls):
        "() Return a list of all instances of this Sprite"
        return registered_instances(cls)

    def go_to_xy(self, x, y):
        "(X, Y) Move SELF to location (X, Y) on the stage"
        self._x = x
        self._y = y

    @property
    def x_position(self):
        "SELF's x-coordinate on the stage"
        return self._x

    def set_x(self, x):
        "(X) Move SELF horizontally to x-coord X"
        self._x = x

    def change_x(self, dx):
        "(DX) Move SELF right DX on the stage (left if negative)"
        self._x += dx

    @property
    def y_position(self):
        "SELF's y-coordinate on the stage"
        return self._y

    def set_y(self, y):
        "(Y) Move SELF vertically to y-coord Y"
        self._y = y

    def change_y(self, dy):
        "(DY) Move SELF up DY on the stage (down if negative)"
        self._y += dy

    def turn_degrees(self, d_angle):
        "(ANGLE) Turn ANGLE degrees anticlockwise"
        d_angle_radians = MATH_PI * d_angle / 180.0
        self._rotation += d_angle_radians
        self._rotation %= (2.0 * MATH_PI)

    def point_degrees(self, angle):
        "(ANGLE) Set rotation to ANGLE degrees"
        self._rotation = MATH_PI * angle / 180.0

    @property
    def direction(self):
        "The direction SELF is pointing (in degrees)"
        return 180.0 * self._rotation / MATH_PI

    @direction.setter
    def direction(self, _value):
        raise RuntimeError(
            "use point_degrees() or turn_degrees() to set"
            " or change the direction SELF is pointing"
        )

    def glide_to_xy(self, destination_x, destination_y, seconds, easing="linear"):
        "(X, Y, SECONDS) Move SELF smoothly to (X, Y), taking SECONDS"
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

        if easing not in glide_easing.named:
            raise ValueError(f'"{easing}" not a known kind of easing')

        easing_curve = glide_easing.named[easing]

        # On completion, we must be exactly at the target, and we want
        # the first frame to involve some movement, so count from 1 up
        # to n_frames (inclusive) rather than 0 up to n_frames - 1.
        for frame_idx in range(1, n_frames + 1):
            t0 = frame_idx / n_frames  # t is in (0.0, 1.0]
            t = easing_curve(t0)
            t_c = 1.0 - t  # 'complement'
            x = t * destination_x + t_c * start_x
            y = t * destination_y + t_c * start_y
            self.go_to_xy(x, y)
            wait_seconds(0)  # No auto-yield (we don't do "import pytch")

    def set_size(self, size):
        "(SIZE) Set SELF's size to SIZE"
        self._size = size

    @property
    def size(self):
        "SELF's current size"
        return self._size

    def show(self):
        "() Make SELF visible"
        if not self.Costumes:
            # See comment in __init__().
            raise RuntimeError('cannot show a Sprite with no Costumes')
        self._shown = True

    def hide(self):
        "() Make SELF invisible"
        self._shown = False

    def switch_costume(self, costume_name):
        "(COSTUME) Switch SELF to wearing COSTUME (name/number)"
        self.switch_appearance(costume_name)

    def next_costume(self, n_steps=1):
        "(N=1) Switch SELF to Nth next costume, looping if past last"
        self.next_appearance(n_steps)

    @property
    def costume_number(self):
        "The number of the costume SELF is currently wearing"
        return self.appearance_number

    @property
    def costume_name(self):
        "The name of the costume SELF is currently wearing"
        return self.appearance_name

    def touching(self, target_class):
        "(TARGET) Return whether SELF touches any TARGET instance"
        return (self._pytch_parent_project
                .instance_is_touching_any_of(self, target_class))

    def delete_this_clone(self):
        "() Remove SELF from the project"
        self._pytch_parent_project.unregister_actor_instance(self)

    def go_to_front_layer(self):
        "() Move SELF to the front drawing layer"
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "absolute", -1))

    def go_to_back_layer(self):
        "() Move SELF to the back drawing layer"
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "absolute", 0))

    def go_forward_layers(self, n_layers):
        "(N) Move SELF forwards N drawing layers"
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "relative", n_layers))

    def go_backward_layers(self, n_layers):
        "(N) Move SELF backwards N drawing layers"
        (self._pytch_parent_project
         .move_within_draw_layer_group(self, "relative", -n_layers))

    def say(self, content):
        "(TEXT) Say TEXT in speech bubble; remove if TEXT empty"
        self._speech = (
            None if content == ""
            else (_new_speech_id(), "say", content)
        )

    def say_for_seconds(self, content, seconds):
        "(TEXT, SECONDS) Give SELF speech bubble saying TEXT for SECONDS"
        if not isinstance(seconds, (int, float)):
            raise ValueError("the SECONDS argument must be a number")
        self.say(content)
        speech_id = self._speech[0]
        wait_seconds(seconds)
        # Only erase utterance if it hasn't already been, and it's ours:
        if (self._speech is not None) and (self._speech[0] == speech_id):
            self.say("")

    def ask_and_wait(self, prompt):
        "(QUESTION) Ask question; wait for and return user's answer"
        if not isinstance(prompt, str):
            raise ValueError("the question must be a string")
        if self._shown:
            self.say(prompt)
            answer = ask_and_wait(None)
            # Scratch clears speech even if the prompt isn't the live
            # speech bubble; do likewise.
            self.say("")
            return answer
        else:
            return ask_and_wait(prompt)


class Stage(Actor):
    "The starting class for your stage"

    Backdrops = [('solid-white', 'solid-white-stage.png')]
    _x = 0
    _y = 0
    _size = 1.0
    _rotation = 0.0
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
        "() Return the only Stage instance"
        return registered_instances(cls)[0]

    def switch_backdrop(self, backdrop_name):
        "(BACKDROP) Switch to the BACKDROP (name/number)"
        self.switch_appearance(backdrop_name)

    def next_backdrop(self, n_steps=1):
        "(N=1) Switch SELF to Nth next backdrop, looping if past last"
        self.next_appearance(n_steps)

    @property
    def backdrop_number(self):
        "The number of the backdrop SELF is currently showing"
        return self.appearance_number

    @property
    def backdrop_name(self):
        "The name of the backdrop SELF is currently showing"
        return self.appearance_name

    def ask_and_wait(self, prompt):
        "(QUESTION) Ask question; wait for and return user's answer"
        if not isinstance(prompt, str):
            raise ValueError("the question must be a string")
        return ask_and_wait(prompt)
