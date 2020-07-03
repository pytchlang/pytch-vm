"use strict";

const {
    configure_mocha,
    with_project,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Scheduling: launching, running, blocking, etc., threads

describe("scheduling", () => {
    with_project("py/project/single_sprite.py", (import_project) => {
    it("can launch thread on green-flag", async () => {
        let project = await import_project();
        let instance_0 = project.actors[0].instances[0];

        project.on_green_flag_clicked();
        assert.strictEqual(instance_0.js_attr("n_clicks"), 0);

        project.one_frame();
        assert.strictEqual(instance_0.js_attr("n_clicks"), 1);

        project.one_frame();
        assert.strictEqual(instance_0.js_attr("n_clicks"), 2);

        // And now the thread-group should have finished, and so there
        // should be no live thread-groups in the project.
        assert.strictEqual(project.thread_groups.length, 0);
    })});

    with_project("py/project/two_threads.py", (import_project) => {
    let two_threads_project = async () => {
        let project = await import_project();
        let t1 = project.instance_0_by_class_name("T1");
        let t2 = project.instance_0_by_class_name("T2");

        const assert_counters_both = (exp_counter => {
            assert.strictEqual(t1.js_attr("counter"), exp_counter);
            assert.strictEqual(t2.js_attr("counter"), exp_counter);
        });

        return [project, assert_counters_both];
    };

    it("can run two threads concurrently", async () => {
        let [project, assert_counters_both] = await two_threads_project();

        assert_counters_both(0);

        project.on_green_flag_clicked();
        project.one_frame();

        // After one frame both threads should have had a chance to run.
        assert_counters_both(1);

        // After each further frame, both threads should have gone another time
        // round their 'while' loops.
        for (let i = 0; i < 10; ++i) {
            project.one_frame();
            assert_counters_both(2 + i);
        }
    });

    [{method: 'on_red_stop_clicked', exp_count: 10},
     {method: 'on_green_flag_clicked', exp_count: 5}].forEach(spec =>
    it(`${spec.method} halts everything`, async () => {
        let [project, assert_counters_both] = await two_threads_project();

        project.on_green_flag_clicked();

        // Each frame that runs should increase both counters by 1.
        for (let i = 0; i < 10; ++i)
            project.one_frame();
        assert_counters_both(10);

        // Everything should stop if we hit the red button:
        project[spec.method]();
        for (let i = 0; i < 5; ++i)
            project.one_frame();

        assert_counters_both(spec.exp_count);
    }))});

    class BroadcastActors {
        constructor(project) {
            this.sender = project.instance_0_by_class_name("Sender");
            this.receiver = project.instance_0_by_class_name("Receiver");
        }

        assert_has_steps_and_events(exp_n_steps, exp_n_events) {
            assert.strictEqual(this.sender.js_attr("n_steps"),
                               exp_n_steps,
                               "sender-n-steps");
            assert.strictEqual(this.receiver.js_attr("n_events"),
                               exp_n_events,
                               "receiver-n-events");
        }
    }

    with_project("py/project/broadcast.py", (import_project) => {
    it("can schedule threads on broadcast", async () => {
        let project = await import_project();
        let actors = new BroadcastActors(project);

        // Initially only the __init__() methods have run.
        actors.assert_has_steps_and_events(0, 0);

        // Clicking green flag only launches the threads and puts them
        // in the runnable queue.  Nothing has actually run yet.
        project.on_green_flag_clicked();
        actors.assert_has_steps_and_events(0, 0);

        // First pass through scheduler causes an event in the sender,
        // which notes a step, and broadcasts the message.
        // Broadcasting the message only places a newly-created thread
        // on the receiver in the run queue.  The receiver thread has
        // not yet run.
        project.one_frame();
        actors.assert_has_steps_and_events(1, 0);

        // Next pass through does give the receiver thread a go; and the
        // sender continues to run.
        project.one_frame();
        actors.assert_has_steps_and_events(2, 1);
    })});

    with_project("py/project/broadcast_and_wait.py", (import_project) => {
    it("can pause threads on broadcast/wait", async () => {
        let project = await import_project();
        let actors = new BroadcastActors(project);

        // Initially only the __init__() methods have run.
        actors.assert_has_steps_and_events(0, 0);

        // Clicking green flag only launches the threads and puts them
        // in the runnable queue.  Nothing has actually run yet.
        project.on_green_flag_clicked();
        actors.assert_has_steps_and_events(0, 0);

        // First pass through scheduler causes an event in the sender,
        // which notes a step, and broadcasts the message.
        // Broadcasting the message only places a newly-created thread
        // on the receiver in the run queue.  The receiver thread has
        // not yet run.
        project.one_frame();
        actors.assert_has_steps_and_events(1, 0);

        // Next frame does give the receiver thread a go; it runs
        // until its yield-until-next-frame syscall.  The sender is
        // sleeping.
        project.one_frame();
        actors.assert_has_steps_and_events(1, 1);

        // Next frame: Receiver resumes after its yield and runs to
        // completion.  Sender is still sleeping.
        project.one_frame();
        actors.assert_has_steps_and_events(1, 2);

        // Next frame: Sender wakes up as the thread-group it was
        // sleeping on has finished.
        project.one_frame();
        actors.assert_has_steps_and_events(2, 2);
    })});

    with_project("py/project/wait_seconds.py", (import_project) => {
    it("can pause for a number of seconds", async () => {
        let project = await import_project();

        let alien = project.instance_0_by_class_name("Alien");

        let assert_n_steps = (exp_n_steps => {
            assert.strictEqual(alien.js_attr("n_steps"), exp_n_steps);
        });

        assert_n_steps(0);

        project.on_green_flag_clicked();
        assert_n_steps(0);

        project.one_frame();
        assert_n_steps(1);

        // The thread is now waiting.  For the next 14 one_frame()
        // calls it should not be runnable and so nothing should
        // change.
        for (let i = 0; i != 14; ++i) {
            project.one_frame();
            assert_n_steps(1);
        }

        // But now it runs again, to completion.
        project.one_frame();
        assert_n_steps(2);
        assert.strictEqual(project.thread_groups.length, 0);
    })});

    with_project("py/project/loop_in_module.py", (import_project) => {
    it("yields exactly when meant to", async () => {
        // Loops in a module which explicitly does "import pytch"
        // should have yield_until_next_frame() calls inserted by our
        // modified compiler.  Loops not in such a module --- even a
        // module imported by an "import pytch"-ing module --- should
        // not have their loops so modified.

        let project = await import_project();
        let counter = project.instance_0_by_class_name("Counter");

        let assert_xs = (exp_xs => {
            assert.deepEqual(counter.js_attr("xs"), exp_xs);
        });

        let exp_xs = [0, 0, 0, 0, 0];
        assert_xs(exp_xs);

        // The first loop of increments should all happen as part of the
        // first frame; prepare for that.
        project.do_synthetic_broadcast("go-while");
        exp_xs = [1, 1, 1, 1, 1];

        for (let i = 0; i != 5; ++i) {
            project.one_frame();
            // Only one element should be updated per frame.
            exp_xs[i] = 2;
            assert_xs(exp_xs);
        }

        // Similarly for loops written with 'for' rather than 'while':

        project.do_synthetic_broadcast("go-for");
        exp_xs = [3, 3, 3, 3, 3];

        for (let i = 0; i != 5; ++i) {
            project.one_frame();
            exp_xs[i] = 4;
            assert_xs(exp_xs);
        }
    })});
});
