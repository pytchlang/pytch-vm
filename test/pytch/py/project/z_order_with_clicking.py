import pytch


class Monitor(pytch.Sprite):
    Costumes = []
    clicks = []


# Use short names for sprites to keep test code brief; not related to
# their Costumes.


class Ship(pytch.Sprite):
    # Costume image is 80 x 30.
    Costumes = [('yellow', 'library/images/yellow-banana.png', 40, 15)]

    @pytch.when_I_receive("ship-front")
    def go_to_front(self):
        self.go_to_xy(0, 0)
        self.show()
        self.move_to_front_layer()

    @pytch.when_I_receive("ship-hide")
    def _hide(self):
        self.hide()

    @pytch.when_this_sprite_clicked
    def say_hello_ship(self):
        Monitor.clicks.append('Ship')


class Ball(pytch.Sprite):
    # Costume image is 100 x 200.
    Costumes = [('balloon', 'library/images/balloon.png', 50, 100)]

    @pytch.when_I_receive("ball-front")
    def go_to_front(self):
        self.go_to_xy(0, 0)
        self.show()
        self.move_to_front_layer()

    @pytch.when_I_receive("ball-hide")
    def _hide(self):
        self.hide()

    @pytch.when_this_sprite_clicked
    def say_hello_ball(self):
        Monitor.clicks.append('Ball')
