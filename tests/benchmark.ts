import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Run, Workflow } from "../src/types.js";
import { apiOrigin, request, verifyArtifacts, waitForRun } from "./support.js";

const health = await request<Record<string, unknown>>("/health");
const workflow = (await request<Workflow[]>("/workflows")).find(
  (w) => w.source === "sample",
);
assert.ok(workflow, "Sample workflow must exist");
const seeds = [48219, 9042, 20260929];
const runs: Run[] = [];
const startedAt = new Date().toISOString();
const output = process.env.ONCE_BENCHMARK_OUTPUT || "artifacts/benchmark.json";
await mkdir(path.dirname(output), { recursive: true });
let unexpected = 0;
for (const seed of seeds) {
  for (let level = 0; level <= 4; level++) {
    for (const mode of ["literal", "semantic"] as const) {
      const start = Date.now();
      const run = await waitForRun(
        await request<Run>("/runs", {
          workflowId: workflow.id,
          seed,
          level,
          mode,
        }),
      );
      await verifyArtifacts(run);
      const expectedPass = mode === "semantic" || level < 2;
      if (run.status !== (expectedPass ? "passed" : "failed")) unexpected++;
      if (run.status === "passed") {
        assert.equal(run.checks.length, 6);
        assert.ok(run.checks.every((check) => check.passed));
      }
      runs.push(run);
      // Keep two POSTs for a successful run comfortably below the public cap.
      await writeFile(
        output,
        JSON.stringify(
          {
            startedAt,
            updatedAt: new Date().toISOString(),
            apiOrigin,
            health,
            scope:
              "Synthetic invoice fixture; three seeds; fixed cumulative L0-L4 mutations; one execution per method/seed/level. Seeds change IDs only. No statistical generalization.",
            seeds,
            workflowId: workflow.id,
            N: runs.length,
            unexpected,
            runs,
          },
          null,
          2,
        ),
      );
      process.stdout.write(
        `${mode} L${level} seed=${seed}: ${run.status}; ${run.durationMs}ms\n`,
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 5000 - (Date.now() - start))),
      );
    }
  }
}
assert.equal(unexpected, 0, `Unexpected outcomes; inspect ${output}`);
process.stdout.write(
  `N=${runs.length}; semantic ${runs.filter((r) => r.mode === "semantic" && r.status === "passed").length}/15; literal ${runs.filter((r) => r.mode === "literal" && r.status === "passed").length}/15. Evidence: ${output}\n`,
);
