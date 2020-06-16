from pytch import Project, Sprite, Stage


class StarrySky(Stage):
    # The following spec is malformed because it has extra elements:
    Backdrops = [('night', 'some-url', 'extra', 'elements')]


class Alien(Sprite):
    # The following spec is malformed because it omits the 'centre-x'
    # and 'centre-y' values:
    Costumes = [('marching', 'some-url')]


class Spaceship(Sprite):
    # The following spec is malformed because the 'centre-x' is not
    # a number:
    Costumes = [('square', 'some-url', 'banana', 42)]


project = Project()
