import pytch
from pytch import (
    Sprite,
    Stage,
    Project,
    when_I_receive,
    when_green_flag_clicked,
)


class GlobalVariables:
    score_1 = None
    score_2 = None
    score_to_win = None
    ball_is_in_play = None
    ball_min_y = None
    ball_max_y = None
    bat_max_y = None
    bat_min_y = None
    serving_player = None


class PongStage(Stage):
    Backdrops = [('pong', 'library/images/stage/pong-backdrop.png')]

    def __init__(self):
        Stage.__init__(self)
        self.switch_backdrop('pong')

    @when_green_flag_clicked
    def run(self):
        self.set_constants()
        self.play_one_game()

    def set_constants(self):
        GlobalVariables.bat_min_y = -126
        GlobalVariables.bat_max_y = 105
        GlobalVariables.score_to_win = 3
        GlobalVariables.ball_is_in_play = False

    def play_one_game(self):
        GlobalVariables.score_1 = 0
        GlobalVariables.score_2 = 0
        pytch.broadcast_and_wait('Update_Score')
        while ((GlobalVariables.score_1 < GlobalVariables.score_to_win)
               and (GlobalVariables.score_2 < GlobalVariables.score_to_win)):
            pytch.broadcast_and_wait('Play_One_Point')
        pytch.broadcast_and_wait('Announce_Winner')


class Player_1(Sprite):
    Costumes = [('bat', 'library/images/pong-player-1.png', 7, 39)]

    @when_I_receive('Play_One_Point')
    def prepare_to_play(self):
        self.go_to_xy(-220, 0)
        self.switch_costume('bat')
        self.show()

    @when_I_receive('Ball_In_Play')
    def move_as_per_keypresses(self):
        while GlobalVariables.ball_is_in_play:
            if pytch.key_is_pressed('q'):
                self.change_y(3)
                if self.get_y() > GlobalVariables.bat_max_y:
                    self.set_y(GlobalVariables.bat_max_y)
            if pytch.key_is_pressed('a'):
                self.change_y(-3)
                if self.get_y() < GlobalVariables.bat_min_y:
                    self.set_y(GlobalVariables.bat_min_y)

    @when_I_receive('Update_Score')
    def hide_at_end_of_point(self):
        self.hide()

    @when_I_receive('Announce_Winner')
    def gloat_if_won(self):
        if GlobalVariables.score_1 == GlobalVariables.score_to_win:
            self.go_to_xy(0, 0)
            self.show()


class Player_2(Sprite):
    Costumes = [('bat', 'library/images/pong-player-2.png', 7, 39)]

    @when_I_receive('Play_One_Point')
    def prepare_to_play(self):
        self.go_to_xy(220, 0)
        self.switch_costume('bat')
        self.show()

    @when_I_receive('Ball_In_Play')
    def move_as_per_keypresses(self):
        while GlobalVariables.ball_is_in_play:
            if pytch.key_is_pressed('o'):
                self.change_y(3)
                if self.get_y() > GlobalVariables.bat_max_y:
                    self.set_y(GlobalVariables.bat_max_y)
            if pytch.key_is_pressed('l'):
                self.change_y(-3)
                if self.get_y() < GlobalVariables.bat_min_y:
                    self.set_y(GlobalVariables.bat_min_y)

    @when_I_receive('Update_Score')
    def hide_at_end_of_point(self):
        self.hide()

    @when_I_receive('Announce_Winner')
    def gloat_if_won(self):
        if GlobalVariables.score_2 == GlobalVariables.score_to_win:
            self.go_to_xy(0, 0)
            self.show()


class Ball(Sprite):
    Costumes = [('ball', 'library/images/ball.png', 8, 8)]
    Sounds = [('click', 'library/sounds/drumstick-click.mp3')]

    def __init__(self):
        pytch.Sprite.__init__(self)
        self.x_speed = None
        self.y_speed = None
        self.switch_costume('ball')

    @when_green_flag_clicked
    def set_constants(self):
        GlobalVariables.ball_min_y = -171
        GlobalVariables.ball_max_y = 138

    @when_I_receive('Play_One_Point')
    def play_point(self):
        self.decide_who_serves()
        if GlobalVariables.serving_player == 1:
            # 201 is a multiple of 3; likewise -201 below
            self.go_to_xy(-201, 0)
        else:
            self.go_to_xy(201, 0)
        self.show()
        while not pytch.key_is_pressed(' '):
            pass
        GlobalVariables.ball_is_in_play = True
        pytch.broadcast('Ball_In_Play')
        if GlobalVariables.serving_player == 1:
            self.x_speed = 1.5
        else:
            self.x_speed = -1.5
        self.y_speed = 1.5
        self.bounce_until_missed()
        GlobalVariables.ball_is_in_play = False
        self.award_point()

    def decide_who_serves(self):
        if ((GlobalVariables.score_1 + GlobalVariables.score_2 + 1) % 4) < 2:
            GlobalVariables.serving_player = 1
        else:
            GlobalVariables.serving_player = 2

    def bounce_until_missed(self):
        while ((self.get_x() >= -225) and (self.get_x() <= 225)):
            self.change_x(self.x_speed)
            self.change_y(self.y_speed)
            self.bounce_off_top_bottom()
            self.bounce_off_players()

    def bounce_off_top_bottom(self):
        if self.get_y() > GlobalVariables.ball_max_y:
            self.start_sound('click')
            self.set_y(GlobalVariables.ball_max_y)
            self.y_speed = -1.5
        if self.get_y() < GlobalVariables.ball_min_y:
            self.start_sound('click')
            self.set_y(GlobalVariables.ball_min_y)
            self.y_speed = 1.5

    def bounce_off_players(self):
        if self.touching(Player_1):
            self.start_sound('click')
            self.x_speed = -1 * self.x_speed
            self.change_x(4)
        if self.touching(Player_2):
            self.start_sound('click')
            self.x_speed = -1 * self.x_speed
            self.change_x(-4)

    def award_point(self):
        if self.get_x() > 225:
            GlobalVariables.score_1 += 1
        else:
            GlobalVariables.score_2 += 1
        self.hide()
        pytch.broadcast_and_wait('Update_Score')
        pytch.wait_seconds(0.75)

    @when_I_receive('Announce_Winner')
    def hide_while_winner_gloating(self):
        self.hide()


score_costumes = [('digit-%d' % n, 'library/images/digit-%d.png' % n, 14, 14)
                  for n in range(10)]

class Score_1(Sprite):
    Costumes = score_costumes

    @when_green_flag_clicked
    def set_position_and_size(self):
        self.go_to_xy(-220, 162)
        self.hide()

    @when_I_receive('Update_Score')
    def show_correct_digit(self):
        self.switch_costume('digit-%d' % GlobalVariables.score_1)
        self.show()


class Score_2(Sprite):
    Costumes = score_costumes

    @when_green_flag_clicked
    def set_position_and_size(self):
        self.go_to_xy(220, 162)
        self.hide()

    @when_I_receive('Update_Score')
    def show_correct_digit(self):
        self.switch_costume('digit-%d' % GlobalVariables.score_2)
        self.show()


project = Project()
project.register_stage_class(PongStage)
project.register_sprite_class(Player_1)
project.register_sprite_class(Player_2)
project.register_sprite_class(Score_1)
project.register_sprite_class(Score_2)
project.register_sprite_class(Ball)
project.go_live()
