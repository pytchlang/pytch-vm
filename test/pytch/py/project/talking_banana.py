import pytch

class Banana(pytch.Sprite):
    Costumes = ["yellow-banana.png"]

    @pytch.when_I_receive("talk")
    def talk(self):
        self.say("Hello world")

    @pytch.when_I_receive("silence")
    def fall_silent(self):
        self.say_nothing()

    @pytch.when_I_receive("talk-briefly")
    def talk_briefly(self):
        self.say_for_seconds("Mumble", 0.5)

    @pytch.when_I_receive("say-goodbye")
    def say_goodbye(self):
        self.say_for_seconds("Bye!", 1.0)
