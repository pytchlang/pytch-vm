from pytch import Project, Sprite


class Alien(Sprite):
    Costumes = [('angry', 'library/images/no-such-angry-alien.png', 25, 25)]


project = Project()

caught_exception = None
try:
    project.register_sprite_class(Alien)
except RuntimeError as runtime_error:
    caught_exception = runtime_error
