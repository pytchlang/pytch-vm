from pytch import Project, Sprite, Stage


class StarrySky(Stage):
    # The following spec is malformed because it has extra elements:
    Backdrops = [('night', 'some-url', 'extra', 'elements')]


class Alien(Sprite):
    # The following spec is malformed because it is neither a tuple
    # nor a string:
    Costumes = [42]


class Spaceship(Sprite):
    # The following spec is malformed because the 'centre-x' is not
    # a number:
    Costumes = [('square', 'some-url', 'banana', 42)]


project = Project()

caught_exception_StarrySky = None
try:
    project.register_stage_class(StarrySky)
except ValueError as value_error:
    caught_exception_StarrySky = value_error

caught_exception_Alien = None
try:
    project.register_sprite_class(Alien)
except ValueError as value_error:
    caught_exception_Alien = value_error

caught_exception_Spaceship = None
try:
    project.register_sprite_class(Spaceship)
except ValueError as value_error:
    caught_exception_Spaceship = value_error
