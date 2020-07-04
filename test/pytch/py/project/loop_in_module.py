import pytch

from pytch import (
    Sprite,
    Project,
    when_I_receive,
)

# It's a bit clunky to hard-code the location here, but we pass the
# code in as if it were <stdin>, so there's no real way to get the
# true path in this code.
import sys
sys.path.insert(0, "py/project")
import increment_list_elements


class Counter(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.xs = [0] * 5

    @when_I_receive("go-while")
    def modify_list_with_while(self):
        increment_list_elements.increment_every_elt_with_while(self.xs)
        for i in range(5):
            self.xs[i] += 1

    @when_I_receive("go-for")
    def modify_list_with_for(self):
        increment_list_elements.increment_every_elt_with_for(self.xs)
        for i in range(5):
            self.xs[i] += 1


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Counter)
