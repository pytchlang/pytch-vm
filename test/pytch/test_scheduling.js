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
    });

    it("can schedule threads on broadcast", () => {
        let import_result = import_local_file("py/project/broadcast.py");
        let project = import_result.$d.project.js_project;

        let receiver = project.instance_0_by_class_name("Receiver");
        let sender = project.instance_0_by_class_name("Sender");

        assert.strictEqual(sender.js_attr("n_steps"), 0);
        assert.strictEqual(receiver.js_attr("n_events"), 0);

        project.on_green_flag_clicked();

        project.one_frame();
        assert.strictEqual(sender.js_attr("n_steps"), 1);
        assert.strictEqual(receiver.js_attr("n_events"), 0);

        project.one_frame();
        assert.strictEqual(sender.js_attr("n_steps"), 2);
        assert.strictEqual(receiver.js_attr("n_events"), 1);
    });
});
