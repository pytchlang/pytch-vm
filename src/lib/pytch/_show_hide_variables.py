from .syscalls import _show_object_attribute, _hide_object_attribute
from .project import STAGE_WIDTH, STAGE_HEIGHT


DEFAULT_WATCHER_MARGIN = 4


def show_variable(obj, attr, *, label=None, top=None, right=None, bottom=None, left=None):
    "(OBJ, VAR, [...]) Show a watcher for OBJ.VAR"

    if label is None:
        label = attr

    if left is None and right is None:
        left = -(STAGE_WIDTH // 2) + DEFAULT_WATCHER_MARGIN
    if top is None and bottom is None:
        top = (STAGE_HEIGHT // 2) - DEFAULT_WATCHER_MARGIN

    _show_object_attribute(obj, attr, label, (top, right, bottom, left))


def hide_variable(obj, attr):
    "(OBJ, VAR) Hide the watcher for OBJ.VAR"
    _hide_object_attribute(obj, attr)
