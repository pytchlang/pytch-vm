# Top-level package file for 'pytch'.
#
# IMPORTANT: Update the hard-coded list of auto-completions in the webapp
# when adding symbols to this file.

from .project import (
    Project,
)

from .actor import (
    Sprite,
    Stage,
)

from .hat_blocks import (
    when_green_flag_clicked,
    when_I_receive,
    when_key_pressed,
    when_I_start_as_a_clone,
    when_this_sprite_clicked,
    when_stage_clicked,
)

from .clone import (
    create_clone_of,
)

from .loop_iteration_control import (
    LoopIterationsPerFrame,
    non_yielding_loops,
)

from .syscalls import (
    yield_until_next_frame,
    broadcast,
    broadcast_and_wait,
    play_sound,
    stop_all_sounds,
    wait_seconds,
    key_is_pressed,
)
