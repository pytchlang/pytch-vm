from pytch import Project, Sprite, when_I_receive


class Alien(Sprite):
    Costumes = [('marching', 'library/images/marching-alien.png', 25, 25)]

    @when_I_receive('switch-costume')
    def switch_to_bad_costume(self):
        self.switch_costume('angry')


project = Project()
project.register_sprite_class(Alien)
