"use strict";


////////////////////////////////////////////////////////////////////////////////

const mock_keyboard = (() => {
    let undrained_keydown_events = [];
    let key_is_down = {};

    const press_key = (keyname) => {
        key_is_down[keyname] = true;
        undrained_keydown_events.push(keyname);
    };

    const release_key = (keyname) => {
        key_is_down[keyname] = false;
    };

    const drain_new_keydown_events = () => {
        let evts = undrained_keydown_events;
        undrained_keydown_events = [];
        return evts;
    };

    const key_is_pressed = (keyname => (key_is_down[keyname] || false));

    return {
        press_key,
        release_key,
        key_is_pressed,
        drain_new_keydown_events,
    };
})();

const mock_mouse = (() => {
    let undrained_clicks = [];
    let pointer_stage_x = 0.0;
    let pointer_stage_y = 0.0;

    const stage_coords = () => ({ stage_x: pointer_stage_x,
                                  stage_y: pointer_stage_y });

    const move = (x, y) => {
        pointer_stage_x = x;
        pointer_stage_y = y;
    };

    const click = () => { undrained_clicks.push(stage_coords()); };

    const click_at = (x, y) => {
        move(x, y);
        click();
    };

    const drain_new_click_events = () => {
        let evts = undrained_clicks;
        undrained_clicks = [];
        return evts;
    };

    return {
        click_at,
        drain_new_click_events,
    };
})();

const mock_sound_manager = (() => {
    let running_performances_ = [];

    let running_performances = () => running_performances_;

    let async_load_sound = ((tag, url) => {
        return Promise.resolve(new MockSound(mock_sound_manager, tag, url));
    });

    let register_running_performance = (performance => {
        running_performances_.push(performance);
    });

    let one_frame = () => {
        running_performances_.forEach(p => {
            p.n_frames_left -= 1;
            if (p.n_frames_left < 0)
                p.n_frames_left = 0;
            if (p.n_frames_left == 0)
                p.has_ended = true;

            running_performances_
                = running_performances_.filter(p => (! p.has_ended));
        });
    };

    let stop_all_performances = (() => {
        running_performances_.forEach(p => p.has_ended = true);
        running_performances_ = [];
    });

    return {
        running_performances,
        async_load_sound,
        register_running_performance,
        one_frame,
        stop_all_performances,
    };
})();

const pytch_errors = (() => {
    let uncollected_errors = [];

    const append_error = (err => {
        uncollected_errors.push(err);
    });

    const drain_errors = (() => {
        let errors = uncollected_errors;
        uncollected_errors = [];
        return errors;
    });

    return {
        append_error,
        drain_errors,
    };
})();


// Implementation of async-load-image.
// Resolve with the MockImage (see below), or reject with a
// Python-level error if the image is not found.
const async_load_mock_image = (url) => {
    let maybe_image = MockImage.maybe_create(url);
    if (maybe_image === null) {
        let error_message = `could not load image "${url}"`;
        let py_error = new Sk.builtin.RuntimeError(error_message);
        return Promise.reject(py_error);
    } else
        return Promise.resolve(maybe_image);
};
