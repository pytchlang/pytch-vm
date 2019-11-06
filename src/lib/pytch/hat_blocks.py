def _append_handler(fun, handler_type, handler_data=None):
    if not hasattr(fun, '_pytch_handler_for'):
        fun._pytch_handler_for = []
    fun._pytch_handler_for.append((handler_type, handler_data))
    return fun


def when_green_flag_clicked(fun):
    return _append_handler(fun, 'green-flag')


def when_I_start_as_a_clone(fun):
    return _append_handler(fun, 'clone')


class when_I_receive:
    def __init__(self, message):
        self.message = message

    def __call__(self, fun):
        return _append_handler(fun, 'message', self.message)


class when_key_pressed:
    def __init__(self, keyname):
        self.keyname = keyname

    def __call__(self, fun):
        return _append_handler(fun, 'keypress', self.keyname)
