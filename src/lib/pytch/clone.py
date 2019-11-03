import copy
from pytch.syscalls import register_sprite_instance


def create_clone_of_instance(obj):
    new_obj = copy.deepcopy(obj)
    return register_sprite_instance(new_obj)
