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
// Cloning

describe("cloning", () => {
    with_project("py/project/launch_clones.py", (import_project) => {
        it("can clone by instance", async () => {
            let project = await import_project();
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
            one_frame(project);
            assert_all_attrs("copied_id", [42, 42]);
            assert_all_attrs("generated_id", [100, 100]);

            // On the next frame they do their 'when start as clone' stuff:
            one_frame(project);
            assert_all_attrs("copied_id", [42, 43]);
            assert_all_attrs("generated_id", [100, 101]);

            // If we trigger another clone, we should eventually get another id-43
            // one, and also an id-44 one.
            project.do_synthetic_broadcast("clone-self");
            assert_all_attrs("copied_id", [42, 43]);
            assert_all_attrs("generated_id", [100, 101]);

            // On the next frame, clones are created, but their 'when start as
            // clone' handlers do not yet run.
            one_frame(project);
            assert_all_attrs("copied_id", [42, 42, 43, 43]);
            assert_all_attrs("generated_id", [100, 100, 101, 101]);

            // On this frame the 'when start as clone' handlers run.
            one_frame(project);
            assert_all_attrs("copied_id", [42, 43, 43, 44]);
            assert_all_attrs("generated_id", [100, 101, 102, 103]);
        });

        it("can chain-clone", async () => {
            let project = await import_project();
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
                one_frame(project);
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

        it("can delete clones after chain-clone", async () => {
            let project = await import_project();
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
                one_frame(project);
                assert_all_IDs(exp_values);
            };

            // The synthetic broadcast just puts the handler threads in the queue;
            // they don't run immediately.
            project.do_synthetic_broadcast("clone-self");
            many_frames(project, 10);

            assert_all_IDs([1, 2, 3, 4, 5])

            project.do_synthetic_broadcast("destroy-broom-clones");
            frame_then_assert_all_IDs([1]);
        });
    });

    with_project("py/project/unregister_clone.py", (import_project) => {
        it("can unregister a clone", async () => {
            let project = await import_project();
            let beacon = project.instance_0_by_class_name("Beacon");
            let counter = project.instance_0_by_class_name("Counter");

            const n_pings = () => counter.js_attr("n_pings");
            const n_clone_reqs = () => beacon.js_attr("n_clone_reqs");

            const assert_state = (exp_n_clone_reqs, exp_n_pings) => {
                assert.strictEqual(n_clone_reqs(), exp_n_clone_reqs);
                assert.strictEqual(n_pings(), exp_n_pings);
            }

            const frame_then_assert_state = (exp_n_clone_reqs, exp_n_pings) => {
                one_frame(project);
                assert_state(exp_n_clone_reqs, exp_n_pings);
            }

            assert_state(0, 0);
            project.do_synthetic_broadcast("create-clone");

            // There's a frame lag between the broadcast and the counting, and we
            // broadcast on every third frame because of the 'and wait' followed by
            // the auto-added yield_until_next_frame(), so the threads after the
            // first few frames are:
            //
            //     Beacon         Beacon clone            Counter
            // 0   create-clone   deferred bcast/wait     (idle)
            // 1   resume/finish  bcast/wait              count_ping() in run queue
            // 2   (idle)         (wait)                  note ping, thread done
            // 3   (idle)         (yield/next-frame)      (idle)
            // 4   (idle)         bcast/wait              count_ping() in run queue
            // 5   (idle)         (wait)                  note ping, thread done
            // 6   (idle)         (yield/next-frame)      (idle)
            // 7   (idle)         bcast/wait              count_ping() in run queue

            frame_then_assert_state(1, 0);
            frame_then_assert_state(1, 0);
            frame_then_assert_state(1, 1);
            frame_then_assert_state(1, 1);
            frame_then_assert_state(1, 1);
            frame_then_assert_state(1, 2);
            frame_then_assert_state(1, 2);
            frame_then_assert_state(1, 2);

            // This should kill the clone and stop the pinging.
            project.do_synthetic_broadcast("destroy-clones");

            // We don't have any guarantees as to the order in which the different
            // threads will run, so wait a few frames for things to stabilise and
            // then check that the number of pings has stopped increasing.

            many_frames(project, 10);

            let steady_state_n_pings = n_pings();

            for (let i = 0; i < 10; ++i)
                frame_then_assert_state(1, steady_state_n_pings);
        });

        it("does not delete or unregister the original instance", async () => {
            let project = await import_project();

            // Request a clone, and let project run for a bit.
            project.do_synthetic_broadcast("create-clone");
            many_frames(project, 10);

            let beacon_instances = project.actor_by_class_name("Beacon").instances;
            assert.strictEqual(beacon_instances.length, 2);

            let originality_tag = (x => x.js_attr("is_the_original"));
            assert.strictEqual(originality_tag(beacon_instances[0]), "yes");
            assert.strictEqual(originality_tag(beacon_instances[1]), "no");

            let pre_destruction_counter = beacon_instances[0].js_attr("counter");
            // We have executed 10 frames; the create_clone_of() call takes one
            // frame, so we've only incremented the counter 9 times.
            assert.strictEqual(pre_destruction_counter, 9);

            // Request clones destroy themselves; let project run.
            project.do_synthetic_broadcast("destroy-clones");
            many_frames(project, 10);

            // There should be just the original Beacon instance.
            assert.strictEqual(beacon_instances.length, 1);

            // Re-extracting the original Beacon should give us the self-same
            // object we already have.
            let beacon_0 = project.instance_0_by_class_name("Beacon");
            assert.strictEqual(beacon_0, beacon_instances[0]);

            // And that original Beacon should have kept running after
            // the delete_this_clone() call.

            // This should hold in the same thread calling delete_this_clone():
            assert.strictEqual(beacon_0.js_attr("kept_running"), "yes");

            // And in the other thread running on the main instance, which has
            // had ten more iterations of the "increment" loop:
            let post_destruction_counter = beacon_instances[0].js_attr("counter");
            assert.strictEqual(post_destruction_counter, 19);
        })});

    with_project("py/project/launch_clones.py", (import_project) => {
        [
            {
                label: "red-stop",
                action: (project) => project.on_red_stop_clicked(),
            },
            {
                label: "green-flag",
                action: (project) => project.on_green_flag_clicked(),
            },
            {
                label: "stop-all",
                action: (project) => project.do_synthetic_broadcast("halt"),
            },
        ].forEach(spec =>
            it(`${spec.label} deletes all clones`, async () => {
                let project = await import_project();
                let broom_actor = project.actor_by_class_name("Broom");
                let n_brooms = () => broom_actor.instances.length;

                project.do_synthetic_broadcast("clone-self");
                many_frames(project, 10);

                assert.strictEqual(n_brooms(), 5);

                spec.action(project);
                one_frame(project);
                assert.strictEqual(n_brooms(), 1);
            }));
    });

    const codeForPear = `#
            class Pear(pytch.Sprite):
                Costumes = []

                @pytch.when_I_receive("clone")
                def make_clone(self):
                    pytch.create_clone_of(Banana)`;

    it("can clone from a Pytch-registered class", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
                Costumes = []

                @pytch.when_I_receive("run")
                def init_var(self):
                    self.x = 42

                @pytch.when_I_start_as_a_clone
                def update_var(self):
                    self.x *= 2

            ${codeForPear}
        `);

        let banana = project.actor_by_class_name("Banana");
        let banana_xs = () => {
            let raw_xs = banana.instances.map(b => b.js_attr("x"));
            raw_xs.sort((a, b) => (a - b));
            return raw_xs;
        };

        project.do_synthetic_broadcast("run");
        one_frame(project);
        assert.deepStrictEqual(banana_xs(), [42]);

        // After the broadcast, we need one frame for the handler to
        // respond, then another frame for the clone to start its
        // when-I-start-as-clone handler.
        //
        project.do_synthetic_broadcast("clone");
        many_frames(project, 2);
        assert.deepStrictEqual(banana_xs(), [42, 84]);

        project.do_synthetic_broadcast("clone");
        many_frames(project, 2);
        assert.deepStrictEqual(banana_xs(), [42, 84, 84]);
    });

    it("rejects clone from a non-Pytch-registered class", async () => {
        const project = await import_deindented(`

            import pytch

            class Banana:
                pass

            ${codeForPear}
        `);

        project.do_synthetic_broadcast("clone");
        one_frame(project);

        pytch_errors.assert_sole_error_matches(/can only clone a Pytch-registered/);
    });

    it("handles failure of the_original()", async () => {
        // This would require some effort on the user's part, but test anyway:
        const project = await import_deindented(`

            import pytch

            class Banana(pytch.Sprite):
                Costumes = []

                # Deliberately override with error-raising method:
                @classmethod
                def the_original(cls):
                    raise RuntimeError("oh no!")

            ${codeForPear}
        `);

        project.do_synthetic_broadcast("clone");
        one_frame(project);

        pytch_errors.assert_sole_error_matches(/the_original.*failed/);
    });

    it("puts clone just behind parent", async () => {
        const project = await import_deindented(`

            import pytch

            class Balloon(pytch.Sprite):
                Costumes = [('balloon', 'balloon.png', 0, 0)]

                @pytch.when_I_receive("make-clone-x")
                def make_clone_x(self):
                    self.step_dir = "x"
                    pytch.create_clone_of(self)

                @pytch.when_I_receive("make-clone-y")
                def make_clone_y(self):
                    self.step_dir = "y"
                    pytch.create_clone_of(self)

                @pytch.when_I_start_as_a_clone
                def step_x_or_y(self):
                    if self.step_dir == "x":
                        self.change_x(40)
                    else:
                        self.change_y(40)
        `);

        const locations
              = () => project.rendering_instructions().map(i => [i.x, i.y]);
        const assert_render_locations
              = (exp_locations) => assert.deepStrictEqual(locations(),
                                                          exp_locations);

        // There should only be the original, and it hasn't moved.
        assert_render_locations([[0, 0]])

        // Allow two frames; one for the broadcast and one for the
        // when-I-start-as-clone thread to run.
        project.do_synthetic_broadcast("make-clone-x");
        many_frames(project, 2);

        // The clone, which has stepped in the x-dirn, should appear behind the
        // original, i.e., before it in the render list.
        assert_render_locations([[40, 0], [0, 0]])

        project.do_synthetic_broadcast("make-clone-y");
        many_frames(project, 2);

        // The clones, which have stepped in the y-dirn, should appear just
        // behind their respective parents, i.e., just before them in the render
        // list.  (The original stays at the very front, i.e., the very last
        // item in the render list.)
        assert_render_locations([[40, 40], [40, 0], [0, 40], [0, 0]])
    });

    it("handles clone of deleted instance", async () => {
        const project = await import_deindented(`

            import pytch

            class Bar(pytch.Sprite):
                @pytch.when_I_receive("go")
                def start(self):
                    pytch._console_log("start()")
                    pytch.broadcast("make-clone")
                    pytch.broadcast("make-clone")
                    pytch.broadcast("make-clone")

            class PointsShower(pytch.Sprite):
                @pytch.when_I_receive("make-clone")
                def make_clone(self):
                    pytch._console_log("make_clone()")
                    pytch.create_clone_of(self)

                @pytch.when_I_start_as_a_clone
                def delete_self(self):
                    pytch._console_log("delete_self()")
                    self.delete_this_clone()
        `);

        project.do_synthetic_broadcast("go");
        many_frames(project, 5);
    });
});
