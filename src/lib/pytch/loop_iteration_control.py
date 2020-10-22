from .syscalls import (
    push_loop_iterations_per_frame,
    pop_loop_iterations_per_frame,
)


class LoopIterationsPerFrame:
    def __init__(self, n_iterations_per_frame):
        self.n_iterations_per_frame = n_iterations_per_frame

    def __enter__(self):
        push_loop_iterations_per_frame(self.n_iterations_per_frame)

    def __exit__(self, exc_type, exc_value, traceback):
        # Behave the same whether leaving normally or through exception.
        pop_loop_iterations_per_frame()


def multiple_loop_iterations_decorator(n_iters):
    def decorator(fun):
        def decorated_fun(*args, **kwargs):
            with LoopIterationsPerFrame(n_iters):
                return fun(*args, **kwargs)
        return decorated_fun
    return decorator


# A reasonable default might be one second's worth, i.e., 60 frames.
default_n_iters_decorator = multiple_loop_iterations_decorator(60)


def non_yielding_loops(n_iters_or_function):
    if isinstance(n_iters_or_function, int):
        return multiple_loop_iterations_decorator(n_iters_or_function)
    else:
        return default_n_iters_decorator(n_iters_or_function)
