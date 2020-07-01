from pytch.syscalls import registered_instances


def the_original(cls):
    all_instances = registered_instances(cls)
    return all_instances[0]


def all_clones_of(cls):
    all_instances = registered_instances(cls)
    return all_instances[1:]


def all_instances_of(cls):
    return registered_instances(cls)
