import pytch
from pytch import Project, Sprite


class Alien(Sprite):
    Costumes = [['marching', 'marching-alien.png', 30, 10],
                ['firing', 'firing-alien.png', 40, 15]]

    @pytch.when_I_receive("print-costume-info")
    def print_costume_info(self):
        for i, a in enumerate(self._Appearances):
            print("%d, %s, %s, %s, %s" % (i, a.label, a.filename, a.size, a.centre))

    @pytch.when_I_receive("print-current-costume")
    def print_current_costume(self):
        if Alien.costume_number != self.costume_number:
            print(
                "mismatch in costume_number;",
                Alien.costume_number, "on Alien but",
                self.costume_number, "on self"
            )
        elif Alien.costume_name != self.costume_name:
            print(
                "mismatch in costume_name;",
                Alien.costume_name, "on Alien but",
                self.costume_name, "on self"
            )
        else:
            print("%d %s" % (self.costume_number, self.costume_name))

    @pytch.when_I_receive("switch-costume-by-number")
    def switch_costume_by_number(self):
        self.switch_costume(1)
        self.print_current_costume()
        self.switch_costume(0)
        self.print_current_costume()
        self.switch_costume(1)
        self.print_current_costume()

    @pytch.when_I_receive("switch-to-marching")
    def switch_to_marching(self):
        self.switch_costume("marching")

    @pytch.when_I_receive("switch-to-firing")
    def switch_to_firing(self):
        self.switch_costume("firing")

    @pytch.when_I_receive("switch-costume-by-number-prop")
    def switch_costume_by_number_prop(self):
        self.costume_number = 1
        self.print_current_costume()
        self.costume_number = 0
        self.print_current_costume()
        self.costume_number += 1
        self.print_current_costume()

    @pytch.when_I_receive("switch-to-marching-prop")
    def switch_to_marching_prop(self):
        self.costume_name = "marching"

    @pytch.when_I_receive("switch-to-firing-prop")
    def switch_to_firing_prop(self):
        self.costume_name = "firing"

    @pytch.when_I_receive("set-appearance-index-attribute-None")
    def corrupt_appearance_index_None(self):
        self._appearance_index = None

    @pytch.when_I_receive("set-appearance-index-attribute-string")
    def corrupt_appearance_index_string(self):
        self._appearance_index = "hello-world"

    @pytch.when_I_receive("set-appearance-index-attribute-non-integer")
    def corrupt_appearance_index_non_integer(self):
        self._appearance_index = 0.5

    @pytch.when_I_receive("set-appearance-index-attribute-out-of-range-low")
    def corrupt_appearance_index_out_of_range_low(self):
        self._appearance_index = -1

    @pytch.when_I_receive("set-appearance-index-attribute-out-of-range-high")
    def corrupt_appearance_index_out_of_range_high(self):
        self._appearance_index = 2


class Background(pytch.Stage):
    Backdrops = ["wooden-stage.png", "sunny-sky.png", "solid-white-stage.png"]

    @pytch.when_I_receive("print-current-backdrop")
    def print_current_backdrop(self):
        if Background.backdrop_number != self.backdrop_number:
            print(
                "mismatch in backdrop_number;",
                Background.backdrop_number, "on Background but",
                self.backdrop_number, "on self"
            )
        elif Background.backdrop_name != self.backdrop_name:
            print(
                "mismatch in backdrop_name;",
                Background.backdrop_name, "on Background but",
                self.backdrop_name, "on self"
            )
        else:
            print("%d %s" % (self.backdrop_number, self.backdrop_name))

    @pytch.when_I_receive("switch-backdrop-by-number")
    def switch_backdrop_by_number(self):
        self.switch_backdrop(1)
        self.print_current_backdrop()
        self.switch_backdrop(0)
        self.print_current_backdrop()
        self.switch_backdrop(1)
        self.print_current_backdrop()
        self.switch_backdrop(2)
        self.print_current_backdrop()
        self.switch_backdrop(1)
        self.print_current_backdrop()

    @pytch.when_I_receive("switch-to-wooden")
    def switch_to_wooden(self):
        self.switch_backdrop("wooden-stage")

    @pytch.when_I_receive("switch-to-sky")
    def switch_to_sky(self):
        self.switch_backdrop("sunny-sky")

    @pytch.when_I_receive("switch-to-white")
    def switch_to_white(self):
        self.switch_backdrop("solid-white-stage")

    @pytch.when_I_receive("switch-backdrop-by-number-prop")
    def switch_backdrop_by_number_prop(self):
        self.backdrop_number = 1
        self.print_current_backdrop()
        self.backdrop_number = 0
        self.print_current_backdrop()
        self.backdrop_number = 1
        self.print_current_backdrop()
        self.backdrop_number += 1
        self.print_current_backdrop()
        self.backdrop_number -= 1
        self.print_current_backdrop()

    @pytch.when_I_receive("switch-to-wooden-prop")
    def switch_to_wooden_prop(self):
        self.backdrop_name = "wooden-stage"

    @pytch.when_I_receive("switch-to-sky-prop")
    def switch_to_sky_prop(self):
        self.backdrop_name = "sunny-sky"

    @pytch.when_I_receive("switch-to-white-prop")
    def switch_to_white_prop(self):
        self.backdrop_name = "solid-white-stage"


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
project.register_stage_class(Background)
