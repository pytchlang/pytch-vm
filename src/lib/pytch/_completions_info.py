import re

def _parse_raw_doc(raw_doc):
    line0 = raw_doc.split("\n", 1)[0].lstrip()
    if line0.startswith("("):
        m = re.match(r"(\([^)]*\)) (.*)", line0)
        return m.groups()
    else:
        return ("", line0)


def _user_facing_completions():
    """Extract completion info for pytch, Sprite, Stage
    """

    # At call time, to avoid circular import:
    import pytch
    import pytch.actor

    actor_exclusions = [
        "Sounds",
        "ensure_have_appearance_names",
        "appearance_name",
        "appearance_number",
        "next_appearance",
        "switch_appearance",
    ]

    exclusions_by_parent = {
        "pytch": [
            "FRAMES_PER_SECOND",
            "STAGE_HEIGHT",
            "STAGE_WIDTH",
            "play_sound",
            "Project",
            "actor",
            "clone",
            "hat_blocks",
            "loop_iteration_control",
            "project",
            "syscalls",
            "yield_until_next_frame",  # this and all below are advanced; omit
            "LoopIterationsPerFrame",
            "non_yielding_loops",
        ],
        "Actor": actor_exclusions,
        "Sprite": ["Costumes"] + actor_exclusions,
        "Stage": ["Backdrops"] + actor_exclusions,
    }

    records_by_parent = {}
    attributes_without_docstring = []

    for obj in [pytch, pytch.actor.Actor, pytch.Sprite, pytch.Stage]:
        parent_name = obj.__name__
        exclusions = exclusions_by_parent[parent_name]
        records = records_by_parent[parent_name] = []
        for attrname in dir(obj):
            if attrname.startswith("_") or attrname in exclusions:
                continue

            attr = getattr(obj, attrname)
            raw_doc = attr.__doc__

            if raw_doc is not None:
                kind = type(attr).__name__
                suffix, doc = _parse_raw_doc(raw_doc)
                records.append((attrname, suffix, kind, doc))
            else:
                attributes_without_docstring.append(f"{parent_name}.{attrname}")

    return records_by_parent, attributes_without_docstring
