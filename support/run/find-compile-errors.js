require("./require-skulpt").requireSkulpt(false, false);
const fs = require("fs");

Sk.configure({
    __future__: Sk.python3,
    read: (fname => fs.readFileSync(fname, { encoding: "utf8" })),
    output: (...args) => {},
});

async function main(fnames) {
    const utf8decoder = new TextDecoder();
    await Promise.all(fnames.map(async (fname) => {
        const code_text = utf8decoder.decode(fs.readFileSync(fname));
        try {
            const compile_result = Sk.compile(code_text, "<string>", "exec", false);
        } catch (e) {
            const record = {
                filename: fname.split("/").slice(-1)[0],
                line: e.traceback[0].lineno,
                messageText: e.args.v[0].v,
            };
            console.log(JSON.stringify(record));
        }
    }));
}

main(process.argv.slice(2));
