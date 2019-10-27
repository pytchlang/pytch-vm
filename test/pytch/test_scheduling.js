"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Scheduling: launching, running, blocking, etc., threads

describe("scheduling", () => {
    it("can launch thread on green-flag", () => {
        let import_result = import_local_file("py/project/single_sprite.py");
        let project = import_result.$d.project.js_project;
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
    });

    class BroadcastActors {
        constructor(project) {
            this.sender = project.instance_0_by_class_name("Sender");
            this.receiver = project.instance_0_by_class_name("Receiver");
        }

        has_steps_and_events(exp_n_steps, exp_n_events) {
            let sender_correct
                = (this.sender.js_attr("n_steps") === exp_n_steps);
            let receiver_correct
                = (this.receiver.js_attr("n_events") === exp_n_events);

            return (sender_correct && receiver_correct);
        }
    }

    it("can schedule threads on broadcast", () => {
        let import_result = import_local_file("py/project/broadcast.py");
        let project = import_result.$d.project.js_project;
        let actors = new BroadcastActors(project);

        // Initially only the __init__() methods have run.
        assert.ok(actors.has_steps_and_events(0, 0));

        // Clicking green flag only launches the threads and puts them
        // in the runnable queue.  Nothing has actually run yet.
        project.on_green_flag_clicked();
        assert.ok(actors.has_steps_and_events(0, 0));

        // First pass through scheduler causes an event in the sender,
        // which notes a step, and broadcasts the message.
        // Broadcasting the message only places a newly-created thread
        // on the receiver in the run queue.  The receiver thread has
        // not yet run.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(1, 0));

        // Next pass through does give the receiver thread a go; and the
        // sender continues to run.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(2, 1));
    });

    it("can pause threads on broadcast/wait", () => {
        let import_result
            = import_local_file("py/project/broadcast_and_wait.py");
        let project = import_result.$d.project.js_project;
        let actors = new BroadcastActors(project);

        // Initially only the __init__() methods have run.
        assert.ok(actors.has_steps_and_events(0, 0));

        // Clicking green flag only launches the threads and puts them
        // in the runnable queue.  Nothing has actually run yet.
        project.on_green_flag_clicked();
        assert.ok(actors.has_steps_and_events(0, 0));

        // First pass through scheduler causes an event in the sender,
        // which notes a step, and broadcasts the message.
        // Broadcasting the message only places a newly-created thread
        // on the receiver in the run queue.  The receiver thread has
        // not yet run.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(1, 0));

        // Next frame does give the receiver thread a go; it runs
        // until its yield-until-next-frame syscall.  The sender is
        // sleeping.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(1, 1));

        // Next frame: Receiver resumes after its yield and runs to
        // completion.  Sender is still sleeping.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(1, 2));

        // Next frame: Sender wakes up as the thread-group it was
        // sleeping on has finished.
        project.one_frame();
        assert.ok(actors.has_steps_and_events(2, 2));
    });

    it("can pause for a number of seconds", () => {
        let import_result
            = import_local_file("py/project/wait_seconds.py");
        let project = import_result.$d.project.js_project;

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
    });
});
