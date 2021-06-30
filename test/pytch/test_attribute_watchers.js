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

                @pytch.when_I_receive("watch-health")
                def show_health(self):
                    self.health = 99
                    pytch.show_variable(self, "health", right=220)
        `);

        // Initially there should be no watchers.
        many_frames(project, 5);
        assert_renders_as("start", project, []);

        project.do_synthetic_broadcast("watch-score");
        one_frame(project);

        const score_render_instrn = [
            "RenderAttributeWatcher", "score", "42", 176, null, null, -236
        ];

        assert_renders_as("post-watch", project, [score_render_instrn]);

        // Re-watching should make no difference.

        project.do_synthetic_broadcast("watch-score");
        one_frame(project);

        assert_renders_as("post-second-watch", project, [score_render_instrn]);

        // Watch a second (instance) variable.

        project.do_synthetic_broadcast("watch-health");
        one_frame(project);

        const health_render_instrn = [
            "RenderAttributeWatcher", "health", "99", 176, 220, null, null
        ];

        assert_renders_as("post-watch-health", project,
                          [score_render_instrn, health_render_instrn]);

        // Re-watch a second (instance) variable; should make no difference.

        project.do_synthetic_broadcast("watch-health");
        one_frame(project);

        assert_renders_as("post-second-watch-health", project,
                          [score_render_instrn, health_render_instrn]);
    });
});
