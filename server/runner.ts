import { chromium, type Browser, type Page } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Run, Workflow, WorkflowStep } from "../src/types.js";
import { artifactsDir, persist, state, verifyScenario } from "./store.js";
import {
  bridgeNorthstar,
  NORTHSTAR_BRIDGE_ORIGIN,
  startAgentCoreBrowser,
  type AgentCoreSession,
} from "./browser-agentcore.js";
import { resolveBedrockTarget } from "./bedrock.js";

const synonyms: Record<string, string[]> = {
  Customers: ["Customers", "Clients", "Accounts"],
  Billing: ["Billing", "Invoices", "Payments"],
  "New invoice": ["New invoice", "Draft invoice"],
  "Create invoice": ["Create invoice", "Issue invoice"],
  "Export PDF": ["Export PDF", "Download PDF"],
  "Payment terms": ["Payment terms", "Due terms"],
  "Search customers": ["Search customers", "Find clients"],
  "Add line item": ["Add line item", "Add item", "Add another item"],
};
export function semanticNames(name: string): string[] {
  const field = /^(Description|Quantity|Unit price) (\d+)$/.exec(name);
  if (field)
    return [
      name,
      `${({ Description: "Details", Quantity: "Units", "Unit price": "Rate" } as Record<string, string>)[field[1]]} ${field[2]}`,
    ];
  return synonyms[name] ?? [name];
}
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function bind(page: Page, step: WorkflowStep, mode: Run["mode"]) {
  if (mode === "literal") return page.locator(step.selector);
  const roles = [
    "button",
    "textbox",
    "searchbox",
    "spinbutton",
    "combobox",
  ] as const;
  const role = roles.find((candidate) => candidate === step.role);
  if (!role) throw new Error(`Unsupported recorded role ${step.role}`);
  return page.getByRole(role, {
    name: new RegExp(
      `^(?:${semanticNames(step.name).map(escapeRegex).join("|")})$`,
      "i",
    ),
  });
}
export async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ headless: true });
  } catch (chromiumError) {
    try {
      return await chromium.launch({ headless: true, channel: "msedge" });
    } catch {
      throw new Error(
        `No browser available. Run npx playwright install chromium. ${chromiumError instanceof Error ? chromiumError.message.split("\n")[0] : ""}`,
      );
    }
  }
}
export async function executeRun(run: Run, workflow: Workflow): Promise<void> {
  const start = Date.now();
  let browser: Browser | undefined;
  let page: Page | undefined;
  let timedOut = false;
  let pdfValid = false;
  const cloud = process.env.ONCE_BROWSER === "agentcore";
  const limitSeconds = cloud ? 300 : 90;
  let agentCore: AgentCoreSession | undefined;
  let bridge: Awaited<ReturnType<typeof bridgeNorthstar>> | undefined;
  const timer = setTimeout(() => {
    timedOut = true;
    const cleanup = agentCore ? agentCore.stop() : browser?.close();
    if (cleanup)
      void cleanup.catch((error) =>
        process.stderr.write(`Browser timeout cleanup: ${String(error)}\n`),
      );
  }, limitSeconds * 1000);
  const log = async (
    step: string,
    message: string,
    status: "running" | "passed" | "failed",
    screenshot?: string,
  ) => {
    const event = {
      time: new Date().toISOString(),
      step,
      message,
      status,
      ...(screenshot ? { screenshot } : {}),
    };
    run.events.push(event);
    process.stdout.write(
      `${JSON.stringify({ event: "run.progress", runId: run.id, mode: run.mode, ...event })}\n`,
    );
    await persist();
  };
  try {
    run.status = "running";
    await log(
      "session",
      `Starting isolated ${cloud ? "AgentCore" : "local"} browser · ${run.mode} execution`,
      "running",
    );
    if (cloud) {
      agentCore = await startAgentCoreBrowser(run.id);
      browser = agentCore.browser;
      await log(
        "session",
        `AgentCore browser session ${agentCore.sessionId} started in ${process.env.AWS_REGION || "us-east-1"}`,
        "passed",
      );
    } else browser = await launchBrowser();
    const context =
      agentCore?.context ??
      (await browser.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
      }));
    const origin = cloud
      ? NORTHSTAR_BRIDGE_ORIGIN
      : new URL(process.env.ONCE_WEB_ORIGIN || "http://localhost:5173").origin;
    if (cloud) bridge = await bridgeNorthstar(context, run.scenarioId);
    else
      await context.route("**/*", async (route) => {
        if (new URL(route.request().url()).origin === origin)
          await route.continue();
        else await route.abort("blockedbyclient");
      });
    page = await context.newPage();
    page.setDefaultTimeout(4500);
    await page.goto(
      `${origin}/northstar?scenario=${encodeURIComponent(run.scenarioId)}`,
      { waitUntil: "networkidle", timeout: 20000 },
    );
    for (const [index, step] of workflow.steps.entries()) {
      if (timedOut)
        throw new Error(`Run exceeded its ${limitSeconds} second limit.`);
      const useBedrock =
        run.mode === "semantic" && process.env.ONCE_BEDROCK === "1";
      const target = useBedrock
        ? await resolveBedrockTarget(page, step)
        : bind(page, step, run.mode);
      await log(
        step.id,
        `${step.intent} · ${useBedrock ? "Bedrock resolved a visible target" : run.mode === "semantic" ? `visible ${step.role} / ${semanticNames(step.name).join(" | ")}` : step.selector}`,
        "running",
      );
      if (step.action === "fill") await target.fill(step.value ?? "");
      else if (step.action === "select")
        await target.selectOption(step.value ?? "");
      else if (/^(export|download) pdf$/i.test(step.name)) {
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          target.click(),
        ]);
        const filename = `${run.id}.pdf`;
        try {
          await download.saveAs(path.join(artifactsDir, filename));
        } catch (error) {
          const bytes = bridge?.downloadedPdf();
          if (!bytes) throw error;
          await writeFile(path.join(artifactsDir, filename), bytes);
          await log(
            step.id,
            "Browser download observed; PDF bytes preserved from the isolated bridge response",
            "passed",
          );
        }
        const bytes = await readFile(path.join(artifactsDir, filename));
        pdfValid =
          bytes.length > 800 && bytes.subarray(0, 5).toString() === "%PDF-";
        run.pdfUrl = `/artifacts/${filename}`;
      } else await target.click();
      let screenshot: string | undefined;
      if ((index + 1) % 3 === 0) {
        try {
          const filename = `${run.id}-step-${index + 1}.png`;
          await page.screenshot({
            path: path.join(artifactsDir, filename),
            fullPage: true,
            timeout: 5000,
          });
          screenshot = `/artifacts/${filename}`;
          run.screenshot = screenshot;
        } catch (error) {
          await log(
            "screenshot",
            `Intermediate screenshot unavailable: ${error instanceof Error ? error.message : String(error)}`,
            "failed",
          );
        }
      }
      await log(step.id, "Browser action completed", "passed", screenshot);
    }
  } catch (error) {
    run.error = timedOut
      ? `Run exceeded its ${limitSeconds} second limit.`
      : error instanceof Error
        ? error.message.split("\n").slice(0, 4).join("\n")
        : String(error);
    await log("execution", run.error, "failed");
  } finally {
    clearTimeout(timer);
    if (timedOut || Date.now() - start >= limitSeconds * 1000)
      run.error ??= `Run exceeded its ${limitSeconds} second limit.`;
    if (page && !page.isClosed()) {
      try {
        const filename = `${run.id}.png`;
        await page.screenshot({
          path: path.join(artifactsDir, filename),
          fullPage: true,
          timeout: 5000,
        });
        run.screenshot = `/artifacts/${filename}`;
      } catch (error) {
        run.events.push({
          time: new Date().toISOString(),
          step: "screenshot",
          message: `Screenshot unavailable: ${error instanceof Error ? error.message : String(error)}`,
          status: "failed",
        });
      }
    }
    if (agentCore) {
      try {
        await agentCore.stop();
        await log(
          "session",
          `AgentCore browser session ${agentCore.sessionId} stopped`,
          "passed",
        );
      } catch (error) {
        run.error ??= "AgentCore session cleanup could not be confirmed.";
        await log(
          "session",
          `AgentCore session ${agentCore.sessionId} stop failed: ${error instanceof Error ? error.message : String(error)}`,
          "failed",
        );
      }
    } else if (browser) {
      try {
        await browser.close();
      } catch (error) {
        process.stderr.write(`Browser cleanup failed: ${String(error)}\n`);
      }
    }
    const scenario = state.scenarios.find(
      (candidate) => candidate.id === run.scenarioId,
    );
    run.checks = scenario
      ? verifyScenario(scenario, workflow.inputs, pdfValid)
      : [];
    run.status =
      !run.error &&
      run.checks.length > 0 &&
      run.checks.every((check) => check.passed)
        ? "passed"
        : "failed";
    if (run.status === "failed" && !run.error)
      run.error = "Independent business verification did not pass.";
    run.finishedAt = new Date().toISOString();
    run.durationMs = Date.now() - start;
    await log(
      "verification",
      `${run.checks.filter((check) => check.passed).length}/${run.checks.length} independent checks passed`,
      run.status,
      run.screenshot,
    );
  }
}
