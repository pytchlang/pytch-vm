import copy
from pytch.syscalls import register_sprite_instance


def create_clone_of(original):
    """
    Two variants, depending on whether the original is a class or an
    instance.  If a class, we clone its instance-0.
    """
    if isinstance(original, type):
        if not hasattr(original, "_pytch_parent_project"):
            raise ValueError("can only clone a Pytch-registered class")

        # Would be surprising if this fails, but handle anyway.
        try:
            obj = original.the_original()
        except:
            raise RuntimeError("the_original() failed")

    else:
        obj = original

    return create_clone_of_instance(obj)


def create_clone_of_instance(obj):
    new_obj = copy.deepcopy(obj)
    return register_sprite_instance(new_obj)
