import pytch
from pytch import (
    Project,
    Sprite,
    when_green_flag_clicked,
    when_I_receive,
    when_key_pressed,
    when_gpio_goes_high,
    when_gpio_goes_low,
)


class FlagClickCounter(Sprite):
    def __init__(self):
        Sprite.__init__(self)
        self.n_clicks = 0

    @when_green_flag_clicked
    def note_click(self):
        self.n_clicks += 1
        pytch.wait_seconds(0)
        self.n_clicks += 1

    @when_I_receive('reset')
    def reset_n_clicks(self):
        self.n_clicks = 0

    @when_key_pressed('x')
    def forget_a_click(self):
        self.n_clicks -= 1

    @when_gpio_goes_low(5)
    def pin_5_HL_default(self):
        pass

    @when_gpio_goes_low(6, "pull-down")
    def pin_6_HL_pd(self):
        pass

    @when_gpio_goes_high(7)
    def pin_7_LH_default(self):
        pass

    @when_gpio_goes_high(8, "no-pull")
    def pin_8_LH_pu(self):
        pass


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(FlagClickCounter)
