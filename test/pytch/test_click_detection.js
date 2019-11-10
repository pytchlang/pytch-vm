"use strict";


////////////////////////////////////////////////////////////////////////////////
//
// Click detection

describe("click detection", () => {
    it("can report all shown instances", async () => {
        let project = await import_project("py/project/clones_for_instance_list.py");

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
        project.one_frame();
        project.do_synthetic_broadcast("clone-self");
        project.one_frame();

        // Extra frame to let all when-I'm-cloned handlers run:
        project.one_frame();

        assert_all_ids([42, 100, 101, 102, 103]);

        project.do_synthetic_broadcast("hide-if-lt-102");
        project.one_frame();
        assert_all_ids([42, 102, 103]);
    });
});
