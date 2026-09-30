import assert from "node:assert/strict";
import { launchBrowser } from "../server/runner.js";
import type { Workflow, Run } from "../src/types.js";
import { apiOrigin, verifyArtifacts, waitForRun } from "./support.js";

const webOrigin =
  process.env.ONCE_UI_ORIGIN ||
  process.env.ONCE_API_ORIGIN ||
  "http://localhost:5173";

const browser = await launchBrowser();
try {
  const page = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
  });
  await page.goto(webOrigin);
  await page
    .getByRole("button", { name: "New demonstration", exact: true })
    .click();
  const frame = page.frameLocator(
    'iframe[title="Record a workflow in Northstar"]',
  );
  await frame.getByRole("button", { name: "Customers", exact: true }).click();
  await frame
    .getByRole("button", { name: "Globex Research", exact: true })
    .click();
  await frame.getByRole("button", { name: "Billing", exact: true }).click();
  await frame.getByRole("button", { name: "New invoice", exact: true }).click();
  await frame
    .getByRole("textbox", { name: "Description 1", exact: true })
    .fill("Architecture review");
  await frame
    .getByRole("spinbutton", { name: "Quantity 1", exact: true })
    .fill("2");
  await frame
    .getByRole("spinbutton", { name: "Unit price 1", exact: true })
    .fill("400");
  await frame
    .getByRole("button", { name: "Add line item", exact: true })
    .click();
  await frame
    .getByRole("textbox", { name: "Description 2", exact: true })
    .fill("Security assessment");
  await frame
    .getByRole("spinbutton", { name: "Unit price 2", exact: true })
    .fill("900");
  await frame
    .getByRole("combobox", { name: "Payment terms", exact: true })
    .selectOption("NET_15");
  await frame
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  await Promise.all([
    page.waitForEvent("download"),
    frame.getByRole("button", { name: "Export PDF", exact: true }).click(),
  ]);
  await page
    .getByLabel("Workflow name")
    .fill("Globex custom-input demonstration");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/workflows") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Compile & save workflow", exact: true })
    .click();
  const response = await responsePromise;
  assert.equal(response.status(), 201, await response.text());
  const workflow = (await response.json()) as Workflow;
  assert.equal(workflow.source, "recorded");
  assert.equal(workflow.inputs.customer, "Globex Research");
  const started = await fetch(`${apiOrigin}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workflowId: workflow.id,
      seed: 9042,
      level: 4,
      mode: "semantic",
    }),
  });
  assert.equal(started.status, 202);
  const run = await waitForRun((await started.json()) as Run);
  assert.equal(run.status, "passed", run.error);
  assert.equal(run.checks.length, 6);
  assert.ok(run.checks.every((check) => check.passed));
  await verifyArtifacts(run);
  process.stdout.write(
    `Recorded custom workflow: ${workflow.events.length} events → ${workflow.steps.length} steps; Globex $1700 / Net 15; semantic L4: ${run.status}; ${run.checks.filter((check) => check.passed).length}/${run.checks.length} checks\n`,
  );
} finally {
  await browser.close();
}
