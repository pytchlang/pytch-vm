from pytch import Project, Sprite, Stage, when_I_receive


class Alien(Sprite):
    Costumes = [('marching', 'library/images/marching-alien.png', 25, 25)]

    @when_I_receive('switch-costume')
    def switch_to_bad_costume(self):
        self.switch_costume('angry')


class Table(Stage):
    Backdrops = [('wooden', 'library/images/stage/wooden.png')]

    @when_I_receive('switch-backdrop')
    def switch_to_bad_backdrop(self):
        self.switch_backdrop('plastic')


project = Project()
project.register_sprite_class(Alien)
project.register_stage_class(Table)
