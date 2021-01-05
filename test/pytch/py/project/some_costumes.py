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
        print("%d" % (self.costume_number,))

    @pytch.when_I_receive("switch-to-marching")
    def switch_to_marching(self):
        self.switch_costume("marching")

    @pytch.when_I_receive("switch-to-firing")
    def switch_to_firing(self):
        self.switch_costume("firing")

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


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
