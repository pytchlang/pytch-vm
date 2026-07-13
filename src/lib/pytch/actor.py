from pytch.syscalls import (
    play_sound,
    _get_actor_sound_mix_bus_gain,
    _set_actor_sound_mix_bus_gain,
    _is_Pytch_registered_Sprite,
    _actor_contains_mouse,
    registered_instances,
    unregister_running_instance,
    wait_seconds,
    stop_all_sounds,
    ask_and_wait,
    broadcast,
    broadcast_and_wait,
    key_pressed,
    mouse_down,
    mouse_x,
    mouse_y,
    stop_all,
    _maybe_instance_0,
)

from pytch.clone import create_clone_of

from pytch._show_hide_variables import show_variable, hide_variable

from pytch.project import FRAMES_PER_SECOND, STAGE_WIDTH, STAGE_HEIGHT

import pytch._glide_easing as glide_easing

from math import hypot, atan2

import random

# Close enough:
MATH_PI = 3.141592653589793

STAGE_HALF_WIDTH = STAGE_WIDTH // 2
STAGE_HALF_HEIGHT = STAGE_HEIGHT // 2


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


class DelegatingPropNoInstanceZero(RuntimeError):
    def __init__(self, cls):
        self.cls_name = cls.__name__

    def __str__(self):
        return (
            f"DelegatingPropNoInstanceZero: class '{self.cls_name}'"
            f" has no original instance registered"
        )


class DelegatingMetaclassProp:
    # Data-descriptor assigned to an attribute of the metaclass of the
    # class owning a `DelegatingProp`, to get the desired behaviour of
    # attribute access on the class itself (as opposed to instances).
    def __init__(self, prop, name):
        self.prop = prop
        self.name = name
        self.__doc__ = prop.__doc__

    def __get__(self, cls, metacls=None):
        instance_0 = _maybe_instance_0(cls)
        if instance_0 is None:
            raise DelegatingPropNoInstanceZero(cls)
        return self.prop.fget(instance_0)

    def __set__(self, cls, value):
        raise AttributeError(
            f"property '{self.name}' of '{cls.__name__}'"
            " can only be set on instances,"
            " not on the class itself"
        )


class DelegatingProp:
    def __init__(self, fget, fset=None):
        self.fget = fget
        self.fset = self.raise_read_only if fset is None else fset
        self.__doc__ = fget.__doc__

    def __get__(self, obj, _objtype=None):
        # We should never see "obj is None" under normal usage,
        # because of the descriptor we assign to the metaclass in
        # __set_name__() below.  But behave sensibly if someone tries
        # to be clever.
        return self if obj is None else self.fget(obj)

    def __set__(self, obj, value):
        self.fset(obj, value)

    def __set_name__(self, owner, name):
        self.name = name

        # Here, `owner` is the class which has the `DelegatingProp`
        # instance as an attribute.  Assign a data-descriptopr to the
        # metaclass of `owner` to get the "delegate to instance-0"
        # behaviour when the attribute is accessed on the class.
        setattr(type(owner), name, DelegatingMetaclassProp(self, name))

    def raise_read_only(self, obj, _value):
        raise AttributeError(
            f"property '{self.name}'"
            f" of '{obj.__class__.__name__}' cannot be set"
        )


class ActorMeta(type):
    pass


class Actor(metaclass=ActorMeta):
    Sounds = []
    _appearance_names = None

    def start_sound(self, sound_locator):
        "(SOUND) Start SOUND playing; continue running"
        play_sound(self, sound_locator, False)

    def play_sound_until_done(self, sound_locator):
        "(SOUND) Play SOUND; pause until it finishes playing"
        play_sound(self, sound_locator, True)

    def _get_sound_volume(self):
        "Volume of sounds played by SELF"
        return _get_actor_sound_mix_bus_gain(self)

    def set_sound_volume(self, gain):
        "(VOLUME) Set volume for sounds played by SELF to VOLUME"
        _set_actor_sound_mix_bus_gain(self, gain)

    sound_volume = DelegatingProp(_get_sound_volume, set_sound_volume)

    def change_sound_volume(self, d_gain):
        "(D_VOLUME) Make sounds played by SELF be D_VOLUME louder"
        new_gain = self.sound_volume + d_gain
        _set_actor_sound_mix_bus_gain(self, new_gain)

    @classmethod
    def ensure_have_appearance_names(cls):
        if cls._appearance_names is None:
            cls._appearance_names = [
                appearance.label for appearance in cls._Appearances
            ]

    def switch_appearance(self, appearance_name_or_index, reqd_type=None):
        str_ok = reqd_type is None or reqd_type is str
        int_ok = reqd_type is None or reqd_type is int

        if not (str_ok or int_ok):
            raise ValueError("reqd_type must be one of [None, str, int]")

        self.ensure_have_appearance_names()

        if str_ok and isinstance(appearance_name_or_index, str):
            appearance_name = appearance_name_or_index
            if appearance_name not in self._appearance_names:
                raise KeyError('could not find {} "{}" in class "{}"'
                               .format(self._appearance_hyponym,
                                       appearance_name,
                                       self.__class__.__name__))

            self._appearance_index = self._appearance_names.index(appearance_name)
        elif int_ok and isinstance(appearance_name_or_index, int):
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
                    ('could not switch to {0} number {1} in class "{2}":'
                     ' it only has {3} {0}s')
                    .format(self._appearance_hyponym,
                            appearance_index,
                            self.__class__.__name__,
                            n_appearances))

            self._appearance_index = appearance_index
        else:
            reqd_type_description = (
                "string or integer" if reqd_type is None
                else "string" if reqd_type is str
                else "integer"
            )
            raise ValueError(
                ('could not switch {} in class "{}":'
                 ' value must be {}')
                .format(self._appearance_hyponym,
                        self.__class__.__name__,
                        reqd_type_description))

    def switch_appearance_int(self, appearance_index):
        self.switch_appearance(appearance_index, int)

    def switch_appearance_str(self, appearance_index):
        self.switch_appearance(appearance_index, str)

    def next_appearance(self, n_steps):
        if not isinstance(n_steps, int):
            raise ValueError("n_steps must be integer")

        if len(self._Appearances) == 0:
            raise ValueError(
                ('could not move to next {0} in class "{1}":'
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

    @property
    def mouse_down(self):
        "Whether the left mouse button is currently pressed down"
        return mouse_down()

    @property
    def mouse_x(self):
        "The x coordinate of the mouse pointer"
        return mouse_x()

    @property
    def mouse_y(self):
        "The y coordinate of the mouse pointer"
        return mouse_y()

    def _clear_speech(self):
        self._speech = (_new_speech_id(), "say", "")

    def stop_all_sounds(self):
        "() Stop all currently-playing sounds"
        stop_all_sounds()

    def broadcast(self, message):
        "(MESSAGE) Broadcast MESSAGE; continue executing"
        broadcast(message)

    def broadcast_and_wait(self, message):
        "(MESSAGE) Broadcast MESSAGE; pause until all listeners finish"
        broadcast_and_wait(message)

    def wait_seconds(self, seconds):
        "(SECONDS) Pause for the given number of seconds"
        wait_seconds(seconds)

    def stop_all(self):
        "() Stop all currently-running scripts"
        stop_all()

    def show_variable(self, var_name, *, label=None, top=None, right=None, bottom=None, left=None):
        "(VAR, [...]) Show a watcher for self.VAR"
        show_variable(self, var_name, label=label, top=top, right=right, bottom=bottom, left=left)

    def hide_variable(self, var_name):
        "(VAR) Hide the watcher for self.VAR"
        hide_variable(self, var_name)

    def key_pressed(self, key_name):
        "(KEY) Return whether KEY is currently pressed down"
        return key_pressed(key_name)

    def create_clone_of(self, original_cls_or_obj):
        """(SPRITE) Create a clone of a SPRITE class or instance

        Two variants, depending on whether the argument is a class or an
        instance.  If argument is a class, clone the original instance
        of that class.  If argument is an instance, clone that instance.
        """
        create_clone_of(original_cls_or_obj)


class SpriteMeta(ActorMeta):
    pass


class Sprite(Actor, metaclass=SpriteMeta):
    "The starting class for all your sprites"

    Costumes = []

    _appearance_hyponym = 'Costume'

    def __init__(self):
        self._x = 0
        self._y = 0
        self._rotation = 0.0
        self._size = 1.0
        self._clear_speech()

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

    def go_to_mouse(self):
        "() Move SELF to the coordinates of the mouse pointer"
        self.go_to_xy(self.mouse_x, self.mouse_y)

    def go_to_random_position(self):
        "() Move SELF to a random position on the stage"
        self._x = random.randint(-STAGE_HALF_WIDTH, STAGE_HALF_WIDTH)
        self._y = random.randint(-STAGE_HALF_HEIGHT, STAGE_HALF_HEIGHT)

    def _get_x_position(self):
        "SELF's x-coordinate on the stage"
        return self._x

    def set_x(self, x):
        "(X) Move SELF horizontally to x-coord X"
        self._x = x

    x_position = DelegatingProp(_get_x_position, set_x)

    def change_x(self, dx):
        "(DX) Move SELF right DX on the stage (left if negative)"
        self._x += dx

    def _get_y_position(self):
        "SELF's y-coordinate on the stage"
        return self._y

    def set_y(self, y):
        "(Y) Move SELF vertically to y-coord Y"
        self._y = y

    y_position = DelegatingProp(_get_y_position, set_y)

    def change_y(self, dy):
        "(DY) Move SELF up DY on the stage (down if negative)"
        self._y += dy

    def _get_distance_to_mouse(self):
        "The distance between the mouse pointer and SELF"
        return hypot(self._x - self.mouse_x, self._y - self.mouse_y)

    distance_to_mouse = DelegatingProp(_get_distance_to_mouse)

    def _get_direction(self):
        "The direction SELF is pointing (in degrees)"
        return 180.0 * self._rotation / MATH_PI

    def point_degrees(self, angle):
        "(ANGLE) Set rotation to ANGLE degrees"
        self._rotation = MATH_PI * angle / 180.0
        self._rotation %= (2.0 * MATH_PI)

    direction = DelegatingProp(_get_direction, point_degrees)

    def turn_degrees(self, d_angle):
        "(ANGLE) Turn ANGLE degrees anticlockwise"
        d_angle_radians = MATH_PI * d_angle / 180.0
        self._rotation += d_angle_radians
        self._rotation %= (2.0 * MATH_PI)

    def point_towards_mouse(self):
        "() Point SELF towards the mouse pointer"
        dx = self.mouse_x - self._x
        dy = self.mouse_y - self._y
        self._rotation = atan2(dy, dx)

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

    def glide_to_mouse(self, seconds, easing="linear"):
        "(SECONDS) Move SELF smoothly to the mouse pointer, taking SECONDS"
        self.glide_to_xy(self.mouse_x, self.mouse_y, seconds, easing)

    def _get_size(self):
        "SELF's current size"
        return self._size

    def set_size(self, size):
        "(SIZE) Set SELF's size to SIZE"
        self._size = size

    size = DelegatingProp(_get_size, set_size)

    def show(self):
        "() Make SELF visible"
        if not self.Costumes:
            # See comment in __init__().
            raise RuntimeError('cannot show a Sprite with no Costumes')
        self._shown = True

    def hide(self):
        "() Make SELF invisible"
        self._shown = False

    def _get_costume_number(self):
        "The number of the costume SELF is currently wearing"
        return self.appearance_number

    def switch_costume(self, costume_name):
        "(COSTUME) Switch SELF to wearing COSTUME (name/number)"
        self.switch_appearance(costume_name)

    costume_number = DelegatingProp(_get_costume_number, Actor.switch_appearance_int)

    def next_costume(self, n_steps=1):
        "(N=1) Switch SELF to Nth next costume, looping if past last"
        self.next_appearance(n_steps)

    def _get_costume_name(self):
        "The name of the costume SELF is currently wearing"
        return self.appearance_name

    costume_name = DelegatingProp(_get_costume_name, Actor.switch_appearance_str)

    def touching(self, target_class):
        "(TARGET) Return whether SELF touches any TARGET instance"
        if not _is_Pytch_registered_Sprite(target_class):
            raise TypeError(
                "in touching(target_class), target_class must be"
                " a Pytch-registered Sprite class"
            )
        return (self._pytch_parent_project
                .instance_is_touching_any_of(self, target_class))

    def _get_touching_mouse(self):
        "Whether SELF is touching the mouse pointer"
        return _actor_contains_mouse(self)

    touching_mouse = DelegatingProp(_get_touching_mouse)

    def delete_this_clone(self):
        "() Remove SELF from the project"
        unregister_running_instance()

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

    def say(self, text):
        "(TEXT) Say TEXT in speech bubble; remove if TEXT empty"
        if isinstance(text, (int, float)):
            text = str(text)
        if not isinstance(text, str):
            raise ValueError("the TEXT argument must be a string or number")
        self._speech = (_new_speech_id(), "say", text)

    def say_for_seconds(self, text, seconds):
        "(TEXT, SECONDS) Give SELF speech bubble saying TEXT for SECONDS"
        if not isinstance(seconds, (int, float)):
            raise ValueError("the SECONDS argument must be a number")
        self.say(text)
        speech_id = self._speech[0]
        wait_seconds(seconds)
        # Only erase utterance if it's ours:
        if self._speech[0] == speech_id:
            self._clear_speech()

    def ask_and_wait(self, prompt):
        "(QUESTION) Ask question; wait for and return user's answer"
        if not isinstance(prompt, str):
            raise ValueError("the question must be a string")
        if self._shown:
            self.say(prompt)
            answer = ask_and_wait(None)
            # Scratch clears speech even if the prompt isn't the live
            # speech bubble; do likewise.
            self._clear_speech()
            return answer
        else:
            return ask_and_wait(prompt)

    def create_clone(self):
        "() Create a clone of this Sprite instance"
        create_clone_of(self)


class StageMeta(ActorMeta):
    pass


class Stage(Actor, metaclass=StageMeta):
    "The starting class for your stage"

    Backdrops = []
    _x = 0
    _y = 0
    _size = 1.0
    _rotation = 0.0
    _shown = True

    _appearance_hyponym = 'Backdrop'

    def __init__(self):
        # In contrast to Sprites, a Stage is always shown and so
        # must have at least one Backdrop.
        if not self.Backdrops:
            try:
                cls_name = self.__class__.__name__
            except:
                cls_name = "[Unknown]"

            raise ValueError(
                f'there are no Backdrops in Stage class "{cls_name}"'
            )

        self._appearance_index = 0
        self._clear_speech()

    @classmethod
    def the_only(cls):
        "() Return the only Stage instance"
        return registered_instances(cls)[0]

    def _get_backdrop_number(self):
        "The number of the backdrop SELF is currently showing"
        return self.appearance_number

    def switch_backdrop(self, backdrop_name):
        "(BACKDROP) Switch to the BACKDROP (name/number)"
        self.switch_appearance(backdrop_name)

    backdrop_number = DelegatingProp(_get_backdrop_number, Actor.switch_appearance_int)

    def next_backdrop(self, n_steps=1):
        "(N=1) Switch SELF to Nth next backdrop, looping if past last"
        self.next_appearance(n_steps)

    def _get_backdrop_name(self):
        "The name of the backdrop SELF is currently showing"
        return self.appearance_name

    backdrop_name = DelegatingProp(_get_backdrop_name, Actor.switch_appearance_str)

    def ask_and_wait(self, prompt):
        "(QUESTION) Ask question; wait for and return user's answer"
        if not isinstance(prompt, str):
            raise ValueError("the question must be a string")
        return ask_and_wait(prompt)
