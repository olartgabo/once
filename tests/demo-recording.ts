import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import type { Run, Workflow } from "../src/types.js";
import { apiOrigin, request, verifyArtifacts } from "./support.js";

const origin = process.env.ONCE_UI_ORIGIN || apiOrigin;
const health = await request<Record<string, unknown>>("/health");
const videoDir = process.env.ONCE_VIDEO_DIR || "artifacts/video";
await mkdir(videoDir, { recursive: true });
const browser = await chromium.launch({ slowMo: 650 });
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  recordVideo: { dir: videoDir, size: { width: 1600, height: 1000 } },
});
const page = await context.newPage();
const caption = async (text: string, seconds = 8) => {
  await page.evaluate((text) => {
    let el = document.getElementById("once-recording-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "once-recording-caption";
      el.style.cssText =
        "position:fixed;bottom:18px;left:50%;transform:translateX(-50%);z-index:99999;padding:14px 24px;background:#101828;color:white;border-radius:12px;font:20px/1.4 system-ui;max-width:1200px;text-align:center;pointer-events:none;box-shadow:0 4px 24px #0005";
    }
    (document.querySelector("dialog[open]") || document.body).append(el);
    el.textContent = text;
  }, text);
  await page.waitForTimeout(seconds * 1000);
};
try {
  await page.goto(origin);
  const location = new URL(origin).hostname;
  await caption(
    `Once: show it once, run through change. Recorded at ${location}.`,
    10,
  );
  await caption(
    "A recorded click sequence can break when IDs, layout, and labels change.",
    8,
  );
  await page
    .getByRole("button", { name: "New demonstration", exact: true })
    .click();
  const frame = page.frameLocator(
    'iframe[title="Record a workflow in Northstar"]',
  );
  await caption(
    "Demonstrate a real invoice task in the included synthetic Northstar CRM.",
    6,
  );
  for (const name of ["Customers", "Globex Research", "Billing", "New invoice"])
    await frame.getByRole("button", { name, exact: true }).click();
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
  await caption(
    "Two line items, $1,700 total, Net 15. The untouched quantity of one is captured too.",
    6,
  );
  await frame
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  await Promise.all([
    page.waitForEvent("download"),
    frame.getByRole("button", { name: "Export PDF", exact: true }).click(),
  ]);
  await page.getByLabel("Workflow name").fill("Globex invoice and PDF");
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/workflows") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Compile & save workflow", exact: true })
    .click();
  const response = await saved;
  assert.equal(response.status(), 201, await response.text());
  const workflow = (await response.json()) as Workflow;
  await page
    .getByRole("button", { name: "Workflow spec", exact: true })
    .click();
  await caption(
    "The compiler retains demonstrated values, action order, and event provenance.",
    8,
  );
  await page.getByRole("button", { name: /^Demonstration/ }).click();
  await caption(
    "Captured events retain selectors, accessible controls, timestamps, and typed values.",
    8,
  );
  await page.getByRole("button", { name: "Mutation lab", exact: true }).click();
  await page.getByLabel("Workflow", { exact: true }).selectOption(workflow.id);
  await page.getByLabel("Reproducible seed").fill("48219");
  await page.getByRole("button", { name: /L4 Rewritten labels/ }).click();
  await caption(
    "L4 combines theme, ID, layout, and supported label changes. Both methods get fresh data.",
    8,
  );
  await page
    .getByRole("button", { name: "Compare both methods", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compare both methods", exact: true })
    .waitFor({ state: "visible" });
  const deadline = Date.now() + 350_000;
  let paired: Run[] = [];
  while (Date.now() < deadline) {
    paired = (await request<Run[]>("/runs")).filter(
      (r) => r.workflowId === workflow.id && r.level === 4,
    );
    if (
      paired.length === 2 &&
      paired.every((r) => r.status === "passed" || r.status === "failed")
    )
      break;
    await page.waitForTimeout(1000);
  }
  const semantic = paired.find((r) => r.mode === "semantic");
  const literal = paired.find((r) => r.mode === "literal");
  assert.equal(literal?.status, "failed");
  assert.equal(semantic?.status, "passed", semantic?.error);
  assert.ok(semantic);
  assert.equal(semantic.checks.length, 6);
  assert.ok(semantic.checks.every((check) => check.passed));
  await verifyArtifacts(semantic);
  await caption(
    "Observed result: selector replay failed; visible-role binding passed this supported L4 fixture.",
    10,
  );
  const dialog = page.getByRole("dialog");
  await dialog.locator(".verification").scrollIntoViewIfNeeded();
  await caption(
    "Six business checks verify the saved invoice. The exported PDF and screenshots are downloadable.",
    10,
  );
  await page.evaluate(() =>
    document.getElementById("once-recording-caption")?.remove(),
  );
  await page.waitForTimeout(5000);
  await page.screenshot({
    path: path.join(videoDir, "verified-run.png"),
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await caption(
    `Runtime: ${health.browser}; compiler: ${health.compiler}. These are the settings used in this recording.`,
    10,
  );
  await caption(
    "Scope: one synthetic invoice task, fixed mutations, and predefined equivalent labels. AWS model adapters remain unverified.",
    10,
  );
  await writeFile(
    path.join(videoDir, "recording.json"),
    JSON.stringify(
      {
        origin,
        health,
        recordedAt: new Date().toISOString(),
        workflow,
        runs: paired,
        scope:
          "Scripted real browser walkthrough with captions; no voiceover; no cuts.",
      },
      null,
      2,
    ),
  );
} finally {
  await context.close();
  await page.video()?.saveAs(path.join(videoDir, "once-walkthrough.webm"));
  await browser.close();
}
process.stdout.write(
  `Walkthrough saved to ${path.join(videoDir, "once-walkthrough.webm")}\n`,
);
