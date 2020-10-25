"use strict";

const {
    configure_mocha,
    with_project,
    with_module,
    one_frame,
    assert,
    mock_sound_manager,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Sounds

describe("waiting and non-waiting sounds", () => {
    let one_frame_fun = (project => () => {
        mock_sound_manager.one_frame();
        one_frame(project);
    });

    let assert_running_performances = (exp_tags => {
        let got_tags = (mock_sound_manager.running_performances()
                        .map(p => p.tag));
        assert.deepStrictEqual(got_tags, exp_tags);
    });

    with_project("py/project/make_noise.py", (import_project) => {
    it("can play trumpet", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-trumpet");

        // On the next frame, the sound should start, but the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_trumpet"), "no")

        // On the next frame, the sound should still be playing, and the
        // launching thread will have run to completion.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_trumpet"), "yes")
        assert.strictEqual(project.thread_groups.length, 0);

        // For the rest of the length of the 'trumpet' sound, it should stay
        // playing.
        let exp_remaining_trumpet_frames = 20 - 2;
        for (let i = 0; i != exp_remaining_trumpet_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet"]);
        }

        // And then silence should fall again:
        project_one_frame();
        assert_running_performances([]);
    });

    it("can play violin", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-violin");

        // On the next frame, the sound should start, and the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["violin"]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "no")

        // For the rest of the length of the 'violin' sound, it should stay
        // playing, and the thread should remain sleeping.
        let exp_remaining_violin_frames = 10 - 1;
        for (let i = 0; i != exp_remaining_violin_frames; ++i) {
            project_one_frame();
            assert_running_performances(["violin"]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "no")
            assert.strictEqual(project.thread_groups.length, 1);
        }

        // And then silence should fall again as the thread runs to completion.
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "yes")
    });

    it("can stop sounds", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-violin");
        for (let i = 0; i != 4; ++i) {
            project_one_frame();
            assert_running_performances(["violin"]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "no")
        }

        // Everything should immediately go quiet, but the thread won't be woken
        // up until the following frame.
        project.do_synthetic_broadcast("silence");
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_violin"), "no")

        // The next frame, the calling thread should resume and run to
        // completion.  Nothing further should happen.
        for (let i = 0; i != 10; ++i) {
            project_one_frame();
            assert_running_performances([]);
            assert.strictEqual(orchestra.js_attr("played_violin"), "yes")
            assert.strictEqual(project.thread_groups.length, 0);
        }
    });

    it("can play both", async () => {
        let project = await import_project();
        let orchestra = project.instance_0_by_class_name("Orchestra");
        let project_one_frame = one_frame_fun(project);

        project.do_synthetic_broadcast("play-both");

        // On the next frame, the trumpet should start, but the launching
        // thread shouldn't have run again yet.
        project_one_frame();
        assert_running_performances(["trumpet"]);
        assert.strictEqual(orchestra.js_attr("played_both"), "no")

        // On the next frame, the violin should start, and the launching
        // thread should be sleeping.
        project_one_frame();
        assert_running_performances(["trumpet", "violin"]);
        assert.strictEqual(orchestra.js_attr("played_both"), "nearly")

        // For the rest of the length of the 'violin' sound, both sounds should
        // stay playing, and the thread should remain sleeping.
        let exp_remaining_violin_frames = 10 - 1;
        for (let i = 0; i != exp_remaining_violin_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet", "violin"]);
            assert.strictEqual(orchestra.js_attr("played_both"), "nearly")
            assert.strictEqual(project.thread_groups.length, 1);
        }

        // For the rest of the length of the 'trumpet' sound, it alone should
        // stay playing, with the thread having run to completion.
        let exp_remaining_trumpet_frames = (20 - 10 - 1);
        for (let i = 0; i != exp_remaining_trumpet_frames; ++i) {
            project_one_frame();
            assert_running_performances(["trumpet"]);
            assert.strictEqual(orchestra.js_attr("played_both"), "yes")
            assert.strictEqual(project.thread_groups.length, 0);
        }

        // And then silence should fall again.
        project_one_frame();
        assert_running_performances([]);
        assert.strictEqual(orchestra.js_attr("played_both"), "yes")
    })});
});

describe("bad sounds", () => {
    with_module("py/project/bad_sound.py", (import_module) => {
        it("throws Python error if sound not found", async () => {
            let module = await import_module();
            let caught_exception = module.$d.caught_exception;
            let err_msg = Sk.builtin.str(caught_exception).v;
            assert.ok(/could not load Sound/.test(err_msg));
            assert.equal(caught_exception.kind, "Sound");
        });
    });
});

