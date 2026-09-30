import assert from "node:assert/strict";
import type { Run, Workflow } from "../src/types.js";
import { request, verifyArtifacts, waitForRun } from "./support.js";

const workflows = await request<Workflow[]>("/workflows");
const workflow = workflows.find((candidate) => candidate.source === "sample");
assert.ok(workflow, "The sample workflow must exist");
for (const test of [
  { mode: "semantic", level: 0, pass: true },
  { mode: "semantic", level: 2, pass: true },
  { mode: "semantic", level: 4, pass: true },
  { mode: "literal", level: 0, pass: true },
  { mode: "literal", level: 2, pass: false },
  { mode: "literal", level: 4, pass: false },
] as const) {
  const run = await waitForRun(
    await request<Run>("/runs", {
      workflowId: workflow.id,
      seed: 48219,
      level: test.level,
      mode: test.mode,
    }),
  );
  process.stdout.write(
    `${test.mode} L${test.level} seed=48219: ${run.status}; checks ${run.checks.filter((check) => check.passed).length}/${run.checks.length}; ${run.durationMs}ms\n`,
  );
  assert.equal(run.status, test.pass ? "passed" : "failed", run.error);
  await verifyArtifacts(run);
  if (test.pass) {
    assert.equal(run.checks.length, 6);
    assert.ok(run.checks.every((check) => check.passed));
    assert.ok(run.pdfUrl, "PDF artifact must exist");
    const intermediate = run.events.filter(
      (event) => event.step.startsWith("step-") && event.screenshot,
    );
    assert.equal(
      intermediate.length,
      Math.floor(workflow.steps.length / 3),
      "Each three completed actions must produce an intermediate screenshot",
    );
    assert.equal(
      new Set(intermediate.map((event) => event.screenshot)).size,
      intermediate.length,
      "Intermediate screenshots must have unique artifact paths",
    );
  }
}
