"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    many_frames,
    assert_renders_as,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Attribute watchers

describe("Attribute watchers", () => {
    it("can render a Sprite variable", async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                start_shown = False

                @pytch.when_I_receive("watch-score")
                def show_score(self):
                    self.score = 42
                    pytch.show_variable(self, "score")
        `);

        // Initially there should be no watchers.
        many_frames(project, 5);
        assert_renders_as("start", project, []);

        project.do_synthetic_broadcast("watch-score");
        one_frame(project);

        assert_renders_as(
            "post-watch", project,
            [["RenderAttributeWatcher", "score", "42", 176, null, null, -236]]
        );

        // Re-watching should make no difference.

        project.do_synthetic_broadcast("watch-score");
        one_frame(project);

        assert_renders_as(
            "post-second-watch", project,
            [["RenderAttributeWatcher", "score", "42", 176, null, null, -236]]
        );
    });
});
