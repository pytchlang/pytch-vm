"use strict";

const {
    configure_mocha,
    assert,
} = require("./pytch-testing.js");
configure_mocha();


////////////////////////////////////////////////////////////////////////////////
//
// Extraction of completion info

describe("Completion info extraction", () => {
    describe("parses raw docstrings correctly", () => {
        const mod = Sk.builtin.__import__("pytch._completions_info", {}, {}, [], -1);

        const parseFun = Sk.builtin.getattr(
            Sk.builtin.getattr(
                mod,
                new Sk.builtin.str("_completions_info")
            ),
            new Sk.builtin.str("_parse_raw_doc")
        );

        const parse = (jsString) => {
            const pyString = new Sk.builtin.str(jsString);
            const pyResult = parseFun.tp$call([pyString], {});
            return {
                suffix: pyResult.v[0].v,
                doc: pyResult.v[1].v,
            };
        };

        it("without suffix", () => {
            const { suffix, doc } = parse("Hello world");
            assert.equal(suffix, "");
            assert.equal(doc, "Hello world");
        });

        it("with suffix", () => {
            const { suffix, doc } = parse("(GREETING) Hello");
            assert.equal(suffix, "(GREETING)");
            assert.equal(doc, "Hello");
        });

        it("empty-parentheses suffix", () => {
            const { suffix, doc } = parse("() Hello");
            assert.equal(suffix, "()");
            assert.equal(doc, "Hello");
        });

        it("multiline", () => {
            const { suffix, doc } = parse("Hello\nworld");
            assert.equal(suffix, "");
            assert.equal(doc, "Hello");
        });
    });

    const completionInfo = () => {
        const mod = Sk.builtin.__import__("pytch", {}, {}, [], -1);
        const completionsInfoFun = Sk.builtin.getattr(
            mod,
            new Sk.builtin.str("_user_facing_completions")
        );
        const [completions, attrsWithoutDocs] = completionsInfoFun.tp$call([], {}).v;
        return { completions, attrsWithoutDocs };
    };
});
