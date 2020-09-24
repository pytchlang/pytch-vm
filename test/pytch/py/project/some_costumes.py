import pytch
from pytch import Project, Sprite


class Alien(Sprite):
    Costumes = [['marching', 'marching-alien.png', 30, 10],
                ['firing', 'firing-alien.png', 40, 15]]

    @pytch.when_I_receive("print-costume-info")
    def print_costume_info(self):
        for i, a in enumerate(self._Appearances):
            print("%d, %s, %s, %s, %s" % (i, a.label, a.filename, a.size, a.centre))


# --cut-here-for-auto-config--

project = Project()
project.register_sprite_class(Alien)
