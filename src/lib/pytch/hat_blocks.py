def _append_handler(fun, handler_type, handler_data=None):
    if not hasattr(fun, '_pytch_handler_for'):
        fun._pytch_handler_for = []
    fun._pytch_handler_for.append((handler_type, handler_data))
    return fun


def when_green_flag_clicked(fun):
    "Run your method when the user clicks the green flag"
    return _append_handler(fun, 'green-flag')


def when_I_start_as_a_clone(fun):
    "Run your method on a newly-created clone"
    return _append_handler(fun, 'clone')


class when_I_receive:
    "(MESSAGE) Run your method when something broadcasts MESSAGE"
    def __init__(self, message):
        self.message = message

    def __call__(self, fun):
        return _append_handler(fun, 'message', self.message)


class when_key_pressed:
    "(KEY) Run your method when the user presses KEY"
    def __init__(self, keyname):
        self.keyname = keyname

    def __call__(self, fun):
        return _append_handler(fun, 'keypress', self.keyname)


def when_this_sprite_clicked(fun):
    "Run your method when the user clicks this Sprite"
    return _append_handler(fun, 'click')


def when_stage_clicked(fun):
    "Run your method when the user clicks the Stage"
    return _append_handler(fun, 'click')


class _when_gpio_sees_edge:
    def __init__(self, pin, edge_kind, pull_kind=None):
        if not isinstance(pin, int):
            raise TypeError("pin must be integer")

        # Let the GPIO server validate the value.

        self.pin = pin

        self.edge_kind = edge_kind
        if pull_kind is None:
            pull_kind = (
                "pull-down" if edge_kind == "low-to-high"
                else "pull-up"
            )

        if pull_kind not in ["pull-up", "pull-down", "no-pull"]:
            raise ValueError(
                'pull_kind must be "pull-up", "pull-down", or "no-pull"'
            )

        self.pull_kind = pull_kind

    def __call__(self, fun):
        return _append_handler(
            fun, 'gpio-edge', (self.pin, self.edge_kind, self.pull_kind)
        )


def when_gpio_goes_high(pin, pull_kind=None):
    "(PIN, PULL_KIND) Run your method when PIN goes high"
    return _when_gpio_sees_edge(pin, "low-to-high", pull_kind)


def when_gpio_goes_low(pin, pull_kind=None):
    "(PIN, PULL_KIND) Run your method when PIN goes low"
    return _when_gpio_sees_edge(pin, "high-to-low", pull_kind)
