import pytch
from pytch import Sprite, when_I_receive


class Banana(Sprite):
    @when_I_receive("banana-front")
    def go_front(self):
        self.move_to_front_layer()

    @when_I_receive("banana-back")
    def go_back(self):
        self.move_to_back_layer()


class Apple(Sprite):
    @when_I_receive("apple-front")
    def go_front(self):
        self.move_to_front_layer()

    @when_I_receive("apple-back")
    def go_back(self):
        self.move_to_back_layer()


class Orange(Sprite):
    @when_I_receive("orange-front")
    def go_front(self):
        self.move_to_front_layer()

    @when_I_receive("orange-back")
    def go_back(self):
        self.move_to_back_layer()


class Pear(Sprite):
    @when_I_receive("pear-forward-2")
    def go_forward_2(self):
        self.move_forward_layers(2)

    @when_I_receive("pear-forward-20")
    def go_forward_20(self):
        self.move_forward_layers(20)

    @when_I_receive("pear-backward-1")
    def go_backward_1(self):
        self.move_backward_layers(1)

    @when_I_receive("pear-backward-10")
    def go_backward_10(self):
        self.move_backward_layers(10)
