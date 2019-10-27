"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Module 'pytch.hat_blocks'

describe("pytch.hat_blocks module", () => {
    class EventsHandledBy {
        constructor(js_cls, js_method_name) {
            let method = js_cls[js_method_name];
            let py_handler_attr = method.$d._pytch_handler_for;
            assert.ok(py_handler_attr);
            this.events_handled = Sk.ffi.remapToJs(py_handler_attr);
        }

        get n_events() {
            return this.events_handled.length;
        }

        includes(evt_type, evt_data) {
            return (this.events_handled
                    .some(([type, data]) =>
                          (type === evt_type && data === evt_data)));
        }
    }
});
