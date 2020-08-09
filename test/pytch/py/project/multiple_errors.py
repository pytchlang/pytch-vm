import pytch
from pytch import Sprite, when_I_receive


class Apple(Sprite):
    @when_I_receive("go")
    def delayed_fail(self):
        pytch.wait_seconds(0.25)
        print(no_such_variable)


class Pear(Sprite):
    @when_I_receive("go")
    def delayed_fail(self):
        pytch.wait_seconds(0.25)
        print(1 / 0)


class Orange(Sprite):
    @when_I_receive("go")
    def delayed_fail(self):
        pytch.wait_seconds(0.25)
        pytch.no_such_function()


class Banana(Sprite):
    @when_I_receive("go")
    def keep_ticking(self):
        self.n_ticks = 0
        while True:
            self.n_ticks += 1
