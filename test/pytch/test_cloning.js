"use strict";

////////////////////////////////////////////////////////////////////////////////
//
// Cloning

describe("cloning", () => {
    it("can clone by instance", async () => {
        let import_result = await import_local_file("py/project/launch_clones.py");
        let project = import_result.$d.project.js_project;
        let alien_actor = project.actor_by_class_name("Alien");
        let all_aliens = () => alien_actor.instances;

        // Do not want to make assumptions about which order instances
        // get cloned, so sort the returned list of values of
        // attributes.
        const assert_all_attrs = (attrname, exp_values) => {
            let values = all_aliens().map(a => a.js_attr(attrname));
            values.sort((x, y) => (x - y));
            assert.deepStrictEqual(values, exp_values);
        };

        // The synthetic broadcast just puts the handler threads in the
        // queue; they don't run immediately.
        project.do_synthetic_broadcast("clone-self");
        assert_all_attrs("copied_id", [42]);
        assert_all_attrs("generated_id", [100]);

        // On the next frame the clones are created with the same state
        // as what they were cloned from.
        project.one_frame();
        assert_all_attrs("copied_id", [42, 42]);
        assert_all_attrs("generated_id", [100, 100]);

        // On the next frame they do their 'when start as clone' stuff:
        project.one_frame();
        assert_all_attrs("copied_id", [42, 43]);
        assert_all_attrs("generated_id", [100, 101]);

        // If we trigger another clone, we should eventually get another id-43
        // one, and also an id-44 one.
        project.do_synthetic_broadcast("clone-self");
        assert_all_attrs("copied_id", [42, 43]);
        assert_all_attrs("generated_id", [100, 101]);

        // On the next frame, clones are created, but their 'when start as
        // clone' handlers do not yet run.
        project.one_frame();
        assert_all_attrs("copied_id", [42, 42, 43, 43]);
        assert_all_attrs("generated_id", [100, 100, 101, 101]);

        // On this frame the 'when start as clone' handlers run.
        project.one_frame();
        assert_all_attrs("copied_id", [42, 43, 43, 44]);
        assert_all_attrs("generated_id", [100, 101, 102, 103]);
    });

    it("can chain-clone", async () => {
        let import_result = await import_local_file("py/project/launch_clones.py");
        let project = import_result.$d.project.js_project;
        let broom_actor = project.actor_by_class_name("Broom");
        let all_brooms = () => broom_actor.instances;

        // Do not want to make assumptions about which order instances get
        // cloned, so sort the returned list of values of attributes.
        const assert_all_IDs = exp_values => {
            let values = all_brooms().map(a => a.js_attr("copied_id"));
            values.sort((x, y) => (x - y));
            assert.deepStrictEqual(values, exp_values);
        };

        const frame_then_assert_all_IDs = exp_values => {
            project.one_frame();
            assert_all_IDs(exp_values);
        };

        // The synthetic broadcast just puts the handler threads in the queue;
        // they don't run immediately.
        project.do_synthetic_broadcast("clone-self");
        assert_all_IDs([1])

        // On the next frame the first clone is created, but the 'when start as
        // clone' handlers do not yet run.
        frame_then_assert_all_IDs([1, 1])

        // On the next frame, the 'when cloned' handlers do run.  This
        // increments the ID and creates another clone.
        frame_then_assert_all_IDs([1, 2, 2])

        // This repeats until we have five instances, with incrementing IDs.
        frame_then_assert_all_IDs([1, 2, 3, 3])
        frame_then_assert_all_IDs([1, 2, 3, 4, 4])
        frame_then_assert_all_IDs([1, 2, 3, 4, 5])

        // After the update of the fifth instance's ID to 5, all threads have
        // run to completion.
        assert.strictEqual(project.thread_groups.length, 0);

        // Nothing should happen now.
        for (let i = 0; i < 10; ++i)
            frame_then_assert_all_IDs([1, 2, 3, 4, 5])
    });

    it("can unregister a clone", async () => {
        let import_result = await import_local_file("py/project/unregister_clone.py");
        let project = import_result.$d.project.js_project;
        let beacon = project.instance_0_by_class_name("Beacon");
        let counter = project.instance_0_by_class_name("Counter");

        const n_pings = () => counter.js_attr("n_pings");
        const n_clone_reqs = () => beacon.js_attr("n_clone_reqs");

        const assert_state = (exp_n_clone_reqs, exp_n_pings) => {
            assert.strictEqual(n_clone_reqs(), exp_n_clone_reqs);
            assert.strictEqual(n_pings(), exp_n_pings);
        }

        const frame_then_assert_state = (exp_n_clone_reqs, exp_n_pings) => {
            project.one_frame();
            assert_state(exp_n_clone_reqs, exp_n_pings);
        }
    });
});
