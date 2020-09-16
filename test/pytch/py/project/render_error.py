import pytch

# By overriding __init__() and not calling the superclass, we stop the
# instance having the attributes needed for rendering, such as
# "_shown".

class Problem(pytch.Sprite):
    Costumes = []
    def __init__(self):
        pass

class OtherProblem(pytch.Sprite):
    Costumes = []
    def __init__(self):
        pass
