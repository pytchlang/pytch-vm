import pytch
from pytch import Project, Sprite


class Alien(Sprite):
    Costumes = [['marching', 'library/images/marching-alien.png', 30, 10],
                ['firing', 'library/images/firing-alien.png', 40, 15]]


project = Project()
project.register_sprite_class(Alien)
