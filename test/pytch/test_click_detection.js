"use strict";

const {
    configure_mocha,
    with_project,
    one_frame,
    assert,
    mock_mouse,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Click detection

describe("click detection", () => {
    with_project("py/project/clones_for_instance_list.py", (import_project) => {
        it("can report all shown instances", async () => {
            let project = await import_project();

            const assert_all_ids = (exp_ids => {
                let everything = project.shown_instances_front_to_back();
                let got_ids = everything.map(a => a.js_attr("generated_id"));

                // Stage should be last:
                assert.strictEqual(got_ids[got_ids.length - 1], 42);

                // Whole lot should be as passed in:
                got_ids.sort((x, y) => (x - y));
                assert.deepStrictEqual(got_ids, exp_ids);
            });

            assert_all_ids([42, 100]);

            project.do_synthetic_broadcast("clone-self");
            one_frame(project);
            project.do_synthetic_broadcast("clone-self");
            one_frame(project);

            // Extra frame to let all when-I'm-cloned handlers run:
            one_frame(project);

            assert_all_ids([42, 100, 101, 102, 103]);

            project.do_synthetic_broadcast("hide-if-lt-102");
            one_frame(project);
            assert_all_ids([42, 102, 103]);
        })});

    with_project("py/project/balloon.py", (import_project) => {
        it("can run balloon-popping game", async () => {
            let project = await import_project();

            let balloon_sprite = project.actor_by_class_name("Balloon");
            let the_Balloon = balloon_sprite.instances[0];

            let balloon_visible = () => the_Balloon.js_attr("_shown");
            let balloon_score = () => the_Balloon.js_attr("score");

            let assert_state_after_next_frame = (exp_visible, exp_score) => {
                one_frame(project);
                assert.strictEqual(balloon_visible(), exp_visible);
                assert.strictEqual(balloon_score(), exp_score);
            };

            assert_state_after_next_frame(true, 0);

            project.on_green_flag_clicked();
            assert_state_after_next_frame(true, 0);

            mock_mouse.click_at(-50, -90);
            assert_state_after_next_frame(true, 0);

            mock_mouse.click_at(-50, -120);
            assert_state_after_next_frame(false, 1);
            assert_state_after_next_frame(false, 1);

            project.do_synthetic_broadcast("reappear");
            assert_state_after_next_frame(true, 1);

            mock_mouse.click_at(-50, -90);
            assert_state_after_next_frame(true, 1);
            mock_mouse.click_at(-50, -120);
            assert_state_after_next_frame(false, 2);

            project.do_synthetic_broadcast("move");
            assert_state_after_next_frame(true, 2);

            mock_mouse.click_at(180, -20);
            assert_state_after_next_frame(true, 2);
            mock_mouse.click_at(170, 120);
            assert_state_after_next_frame(false, 3);
        })});
});
