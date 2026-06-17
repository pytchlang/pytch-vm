// Parallel test runner.
//
// Runs the tokenize/parse/run wrapper plus the Python 2 and Python 3
// unit suites concurrently, sharding the unit suites across worker
// processes.  Each worker is its own `node test/...` process.
//
// Output is condensed: one line per job, with full detail streamed only for
// jobs that report failures.
//
// Usage:  node test/run-parallel.js [--py2-shards N] [--py3-shards M]

const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const program = require("commander");
program
    .option("--py2-shards <n>", "number of Python 2 worker shards", parseInt)
    .option("--py3-shards <n>", "number of Python 3 worker shards", parseInt)
    .parse(process.argv);

// Pick shard counts from core count, biased towards the slower py3 suite.
const cores = Math.max(1, os.cpus().length);
const PY2_SHARDS = program.py2Shards || Math.min(6, cores);
const PY3_SHARDS = program.py3Shards || Math.min(12, Math.max(1, cores - 3));

const ROOT = path.join(__dirname, "..");

function makeJobs() {
    const jobs = [];
    jobs.push({ label: "wrapper", args: ["test/testwrapper.js"] });

    // The shard i/n argument must immediately follow:
    const argsNub = ["--brief", "--shard"];
    const scriptArg = "test/testunit.js";

    for (let i = 1; i <= PY2_SHARDS; i++) {
        const shardId = `${i}/${PY2_SHARDS}`;
        jobs.push({
            label: `py2 ${shardId}`,
            args: [scriptArg, ...argsNub, `${shardId}`],
        });
    }
    for (let i = 1; i <= PY3_SHARDS; i++) {
        const shardId = `${i}/${PY3_SHARDS}`;
        jobs.push({
            label: `py3 ${shardId}`,
            args: [scriptArg, "--python3", ...argsNub, `${shardId}`],
        });
    }
    return jobs;
}

function runJob(job) {
    return new Promise((resolve) => {
        const start = Date.now();
        const child = spawn("node", job.args, { cwd: ROOT });
        let out = "";
        child.stdout.on("data", (d) => {
            out += d;
        });
        child.stderr.on("data", (d) => {
            out += d;
        });
        child.on("close", (code) => {
            // Include info from last "Passed: X Failed: Y" line in
            // output, if such a line exists.
            let passed = null;
            let failed = null;
            const m = /Passed:\s+(\d+)\s+Failed:\s+(\d+)/g;
            let found = null;
            let last = null;
            while ((found = m.exec(out)) !== null) {
                last = found;
            }
            if (last) {
                passed = parseInt(last[1]);
                failed = parseInt(last[2]);
            }

            resolve({
                job,
                out,
                code,
                elapsed: (Date.now() - start) / 1000,
                passed,
                failed,
                ok: code === 0,
            });
        });
    });
}

async function main() {
    const wall = Date.now();
    const jobs = makeJobs();
    console.log(
        `Running ${jobs.length} jobs in parallel`,
        `(${PY2_SHARDS} py2 shards, ${PY3_SHARDS} py3 shards, ${cores} cores)\n`,
    );

    const results = await Promise.all(jobs.map(runJob));

    let totalPassed = 0;
    let totalFailed = 0;
    let anyFail = false;

    // Stream detail for any job that failed.
    for (const r of results) {
        if (!r.ok || (r.failed !== null && r.failed > 0)) {
            console.log(
                `\n===== detail: ${r.job.label} (exit ${r.code}) =====`,
            );
            console.log(r.out.trimEnd());
        }
    }

    const summarySep = "─".repeat(50);

    console.log("\nSummary");
    console.log(summarySep);

    for (const r of results) {
        const counts =
            r.passed !== null
                ? `passed: ${r.passed.toString().padStart(5)}  failed: ${r.failed.toString().padStart(5)}`
                : r.ok
                  ? "ok"
                  : "FAILED";
        const status = r.ok ? "✓" : "✗";
        console.log(
            `  ${status} ${r.job.label.padEnd(10)} ${counts.padEnd(28)}   ${r.elapsed.toFixed(1)}s`,
        );
        if (r.passed !== null) {
            totalPassed += r.passed;
            totalFailed += r.failed;
        }
        if (!r.ok) anyFail = true;
    }

    console.log(summarySep);
    console.log(
	"             ",
        ` passed: ${totalPassed.toString().padStart(5)}`,
        ` failed: ${totalFailed.toString().padStart(5)}`,
        `  ${((Date.now() - wall) / 1000).toFixed(1)}s`,
    );

    process.exit(anyFail || totalFailed > 0 ? 1 : 0);
}

main();
