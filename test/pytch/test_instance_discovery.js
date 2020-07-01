"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Discovery of instances: original, clones, all

describe("instance discovery", () => {
    const prepare_project = async () => {
        let project = await import_project("py/project/instance_discovery.py");

        project.on_green_flag_clicked();
        project.one_frame();

        return project;
    };

    const assert_result = ((project, message, exp_ids) => {
        project.do_synthetic_broadcast(message);
        project.one_frame();

        let scanner = project.instance_0_by_class_name("Scanner");
        let got_ids = scanner.js_attr("got_alien_ids");
        assert.deepEqual(got_ids, exp_ids);
    });

    it("sets up the original Alien", async () => {
        let project = await prepare_project();
        assert_result(project, 'un-listened-for-message', 0);
    });
});
