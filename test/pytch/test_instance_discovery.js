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
});
