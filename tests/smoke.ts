import assert from "node:assert/strict";
import type { Run, Workflow } from "../src/types.js";

const origin = process.env.ONCE_API_ORIGIN || "http://localhost:3001";
async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    `${origin}/api${path}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}
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
  let run: Run = await request<Run>("/runs", {
    workflowId: workflow.id,
    seed: 48219,
    level: test.level,
    mode: test.mode,
  });
  const deadline = Date.now() + 110000;
  while (run.status === "queued" || run.status === "running") {
    assert.ok(Date.now() < deadline, "Run timed out");
    await new Promise((resolve) => setTimeout(resolve, 500));
    run = await request<Run>(`/runs/${run.id}`);
  }
  process.stdout.write(
    `${test.mode} L${test.level} seed=48219: ${run.status}; checks ${run.checks.filter((check) => check.passed).length}/${run.checks.length}; ${run.durationMs}ms\n`,
  );
  assert.equal(run.status, test.pass ? "passed" : "failed", run.error);
  assert.ok(run.screenshot, "Screenshot artifact must exist");
  if (test.pass) {
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
