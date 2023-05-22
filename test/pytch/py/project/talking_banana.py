import pytch

class Banana(pytch.Sprite):
    Costumes = ["yellow-banana.png"]

    @pytch.when_I_receive("talk")
    def talk(self):
        self.say("Hello world")

    @pytch.when_I_receive("silence")
    def fall_silent(self):
        self.say("")

    @pytch.when_I_receive("talk-briefly")
    def talk_briefly(self):
        self.say_for_seconds("Mumble", 0.5)
        print("/mumble")

    @pytch.when_I_receive("say-goodbye")
    def say_goodbye(self):
        self.say_for_seconds("Bye!", 1.0)

    @pytch.when_I_receive("hide")
    def disappear(self):
        self.hide()

    @pytch.when_I_receive("show")
    def appear(self):
        self.show()

    @pytch.when_I_receive("chat")
    def chat(self):
        self.say_for_seconds("Hello!", 2.0)
        self.say_for_seconds("", 1.0)
        self.say_for_seconds("OK bye", 1.0)

    @pytch.when_I_receive("silence-for-seconds")
    def silent_for_second(self):
        self.say_for_seconds("", 1.0)
