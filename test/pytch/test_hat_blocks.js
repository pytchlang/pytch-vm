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

    it("registers green-flag", () => {
        let import_result = import_local_file("py/project/single_sprite.py");

        let py_FlagClickCounter = py_getattr(import_result, "FlagClickCounter");

        let note_click_evts = new EventsHandledBy(py_FlagClickCounter, "note_click");
        assert.strictEqual(note_click_evts.n_events, 1);
        assert.ok(note_click_evts.includes("green-flag", null));
    });
});
