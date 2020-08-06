import pytch
from pytch import Sprite, when_I_receive, when_I_start_as_a_clone


G_next_id = 999
def next_id():
    global G_next_id
    G_next_id += 1
    return G_next_id


class Banana(Sprite):
    @when_I_receive("init")
    def init(self):
        self.id = next_id()

    @when_I_receive("create-clone")
    def create_clone(self):
        pytch.create_clone_of(self)

    @when_I_start_as_a_clone
    def get_own_id(self):
        self.id = next_id()

    @when_I_receive("delete-1003")
    def delete_if_id_1003(self):
        if self.id == 1003:
            self.delete_this_clone()
