from pytch import Project, Sprite


class Alien(Sprite):
    Costumes = [('angry', 'no-such-angry-alien.png', 25, 25)]


project = Project()

caught_exception = None
try:
    project.register_sprite_class(Alien)
except Exception as error:
    caught_exception = error
