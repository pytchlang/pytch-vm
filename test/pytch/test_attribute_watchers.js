"use strict";

const {
    configure_mocha,
    import_deindented,
    one_frame,
    many_frames,
    assert_renders_as,
    pytch_errors,
    assert,
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

                @pytch.when_I_receive("unwatch-score")
                def hide_score(self):
                    pytch.hide_variable(self, "score")

                @pytch.when_I_receive("watch-health")
                def show_health(self):
                    self.health = 99
                    pytch.show_variable(self, "health", right=220)

                @pytch.when_I_receive("unwatch-health")
                def hide_health(self):
                    pytch.hide_variable(self, "health")
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

        // Hide first instance-variable watcher.

        project.do_synthetic_broadcast("unwatch-score");
        one_frame(project);

        assert_renders_as("post-unwatch-score", project, [health_render_instrn]);

        // Hide second instance-variable watcher.

        project.do_synthetic_broadcast("unwatch-health");
        one_frame(project);

        assert_renders_as("post-unwatch-health", project, []);
    });

    it("can render a global variable", async () => {
        const project = await import_deindented(`

            import pytch

            score = 42

            class Banana(pytch.Sprite):
                start_shown = False

                @pytch.when_I_receive("watch-score")
                def show_score(self):
                    pytch.show_variable(None, "score")

                @pytch.when_I_receive("unwatch-score")
                def hide_score(self):
                    pytch.hide_variable(None, "score")
        `);

        const score_render_instrn = [
            "RenderAttributeWatcher", "score", "42", 176, null, null, -236
        ];

        project.do_synthetic_broadcast("watch-score");
        one_frame(project);
        assert_renders_as("post-watch", project, [score_render_instrn]);

        // Re-watching should make no difference.
        project.do_synthetic_broadcast("watch-score");
        one_frame(project);
        assert_renders_as("post-second-watch", project, [score_render_instrn]);

        // Hide first instance-variable watcher.
        project.do_synthetic_broadcast("unwatch-score");
        one_frame(project);
        assert_renders_as("post-unwatch-health", project, []);
    });

    [
        {
            label: "non-string attr-name",
            args_tail: "3.14",
            error_regexp: /attribute name must be string/,
        },
        {
            label: "non-string label",
            args_tail: `"foo", 3.14`,
            error_regexp: /label must be string/,
        },
        {
            label: "non-tuple position",
            args_tail: `"foo", "FOO:", []`,
            error_regexp: /position must be tuple/,
        },
        {
            label: "wrong-length position",
            args_tail: `"foo", "FOO:", (1, 2, 3)`,
            error_regexp: /position must have 4/,
        },
        {
            label: "non-number/null position",
            args_tail: `"foo", "FOO:", (1, 2, 3, "hello")`,
            error_regexp: /elements .* must be number or null/,
        },
        {
            label: "both left and right given",
            args_tail: `"foo", "FOO:", (None, 2, None, 3.14)`,
            error_regexp: /"left" and "right"/,
        },
        {
            label: "both top and bottom given",
            args_tail: `"foo", "FOO:", (42, None, 2, None)`,
            error_regexp: /"top" and "bottom"/,
        },
    ].forEach(spec =>
        it(`rejects bad calls to _show_object_attribute (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                from pytch.syscalls import _show_object_attribute

                class Banana(pytch.Sprite):
                    @pytch.when_I_receive("show-attr")
                    def show_score(self):
                        _show_object_attribute(self, ${spec.args_tail})
            `);

            project.do_synthetic_broadcast("show-attr");
            one_frame(project);

            pytch_errors.assert_sole_error_matches(spec.error_regexp);
        }));

    it("rejects bad call to _hide_object_attribute", async () => {
        const project = await import_deindented(`

            import pytch
            from pytch.syscalls import _hide_object_attribute

            class Banana(pytch.Sprite):
                @pytch.when_I_receive("hide-attr")
                def show_score(self):
                    _hide_object_attribute(self, 42.0)
        `);

        project.do_synthetic_broadcast("hide-attr");
        one_frame(project);

        pytch_errors.assert_sole_error_matches(/attribute name must be string/);
    });

    [
        {
            label: "no such attr",
            attr_name: "score",
            error_regexp: /no attribute 'score'/,
        },
        {
            label: "property div-zero",
            attr_name: "health",
            error_regexp: /division or modulo by zero/,
        },
        {
            label: "property infinite-recursion",
            attr_name: "turtles",
            error_regexp: /call stack size exceeded/,
        },
    ].forEach(spec =>
        it(`gives useful error if getattr fails (${spec.label})`, async () => {
            const project = await import_deindented(`

                import pytch
                class Banana(pytch.Sprite):
                    @property
                    def health(self):
                        return 1 / 0

                    @property
                    def turtles(self):
                        return self.turtles

                    @pytch.when_I_receive("watch")
                    def show_bad_attribute(self):
                        pytch.show_variable(self, "${spec.attr_name}")
            `);

            project.do_synthetic_broadcast("watch");

            // Finding rendering instructions should throw error:
            one_frame(project);

            const err = pytch_errors.sole_error();
            assert.match(err.err.toString(), spec.error_regexp);
            assert.strictEqual(err.ctx.kind, "attribute-watcher");
            assert.strictEqual(err.ctx.attribute_name, spec.attr_name);
            assert.strictEqual(err.ctx.owner_kind, "Sprite");
            assert.strictEqual(err.ctx.owner_name, "Banana");
        }));

    it(`reports best-effort error if getattr fails on non-Actor`, async () => {
        const project = await import_deindented(`

            import pytch
            class Banana(pytch.Sprite):
                @pytch.when_I_receive("watch")
                def show_bad_attribute(self):
                    # String objects have no "height"
                    pytch.show_variable("some-string", "height")
        `);

        project.do_synthetic_broadcast("watch");
        one_frame(project);

        const err = pytch_errors.sole_error();
        assert.strictEqual(err.ctx.kind, "attribute-watcher");
        assert.strictEqual(err.ctx.owner_kind, "unknown");
    })
});
