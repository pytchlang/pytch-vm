import pytch
from pytch import Project, Sprite


class Alien(Sprite):
    colour = 'green'


class Banana(Sprite):
    colour = 'yellow'


project = Project()
project.register_sprite_class(Alien)
project.register_sprite_class(Alien)  # Leads to bad behaviour!
project.register_sprite_class(Banana)
