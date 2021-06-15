"use strict";

const {
    configure_mocha,
    with_project,
    assert,
    many_frames,
    one_frame,
    import_deindented,
    pytch_errors,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Discovery of instances: original, clones, all

describe("instance discovery", () => {
    with_project("py/project/instance_discovery.py", (import_project) => {
        const prepare_project = async () => {
            let project = await import_project();

            project.on_green_flag_clicked();
            one_frame(project);

            return project;
        };

        const assert_result = ((project, message, exp_ids) => {
            project.do_synthetic_broadcast(message);
            one_frame(project);

            let scanner = project.instance_0_by_class_name("Scanner");
            let got_ids = scanner.js_attr("got_ids");
            assert.deepEqual(got_ids, exp_ids);
        });

        const launch_clones = (project => {
            project.do_synthetic_broadcast('make-clones');
            // Ensure enough frames go by for all create_clone_of() calls
            // to run, and all clones' set_id() calls to run also:
            many_frames(project, 3);
        });

        it("sets up the Scanner", async () => {
            let project = await prepare_project();
            assert_result(project, 'un-listened-for-message', 0);
        });

        it("can retrieve the original Alien", async () => {
            let project = await prepare_project();
            assert_result(project, 'get-original', 100);
        });

        it("can retrieve all clones of Alien", async () => {
            let project = await prepare_project();
            launch_clones(project);
            assert_result(project, 'get-clones', [101, 102, 103]);
        });

        it("can retrieve all instances of Alien", async () => {
            let project = await prepare_project();
            launch_clones(project);
            assert_result(project, 'get-instances', [100, 101, 102, 103]);
        })

        it("can retrieve the Stage", async () => {
            let project = await prepare_project();
            assert_result(project, 'get-stage', 42);
        });
    });
});

describe("misuse of instance-discovery API", () => {
    it("gives helpful error for non-Pytch-class", async () => {
        const project = await import_deindented(`

            import pytch
            from pytch.syscalls import registered_instances

            class Mistake(pytch.Sprite):
                @pytch.when_I_receive("non-class")
                def bad_call_non_class(self):
                    registered_instances(42)
        `);

        project.do_synthetic_broadcast("non-class");
        one_frame(project);
        pytch_errors.assert_sole_error_matches(/must be called with class/);
    });
});
