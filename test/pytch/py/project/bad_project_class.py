import pytch

# This is pretty perverse, but check we behave correctly anyway.

class BadProject:
    def __init__(self):
        raise RuntimeError("oh no")

pytch.Project = BadProject
