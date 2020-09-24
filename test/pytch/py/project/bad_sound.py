from pytch import Project, Sprite


class Alien(Sprite):
    Sounds = [('xylophone', 'no-such-instrument.mp3')]


project = Project()

caught_exception = None
try:
    project.register_sprite_class(Alien)
except Exception as error:
    caught_exception = error
