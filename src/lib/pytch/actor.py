class Actor:
    pass


class Sprite(Actor):
    Costumes = [
        ('question-mark',
         'library/images/question-mark.png', 16, 16),
    ]

    def __init__(self):
        self._x = 0
        self._y = 0
        self._size = 1.0
        self._shown = False
        self._appearance = 'question-mark';


class Stage(Actor):
    Backdrops = []
