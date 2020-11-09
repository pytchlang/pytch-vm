import copy
from pytch.syscalls import register_sprite_instance


def create_clone_of(original):
    """
    Two variants, depending on whether the original is a class or an
    instance.  If a class, we clone its instance-0.
    """
    if isinstance(original, type):
        raise NotImplementedError('TODO: Clone instance-0 of a class')

    # TODO: Use instance-0 of 'original' if 'original' is a class.
    else:
        obj = original

    return create_clone_of_instance(obj)


def create_clone_of_instance(obj):
    new_obj = copy.deepcopy(obj)
    return register_sprite_instance(new_obj)
