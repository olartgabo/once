import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  Scenario,
  Workflow,
  Run,
  Check,
  InvoiceInputs,
} from "../src/types.js";
import { sampleWorkflow } from "./compiler.js";
import { totalCents } from "./validation.js";

export const dataDir = path.resolve(process.env.ONCE_DATA_DIR || ".data");
export const artifactsDir = path.join(dataDir, "artifacts");
type State = { workflows: Workflow[]; runs: Run[]; scenarios: Scenario[] };
export const state: State = { workflows: [], runs: [], scenarios: [] };
let pendingWrite = Promise.resolve();
export async function initializeStore(): Promise<void> {
  await mkdir(artifactsDir, { recursive: true });
  try {
    const saved = JSON.parse(
      await readFile(path.join(dataDir, "store.json"), "utf8"),
    ) as State;
    if (
      !Array.isArray(saved.workflows) ||
      !Array.isArray(saved.runs) ||
      !Array.isArray(saved.scenarios)
    )
      throw new Error("Invalid persisted store");
    Object.assign(state, saved);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
  }
  if (!state.workflows.length) state.workflows.push(sampleWorkflow());
  for (const run of state.runs)
    if (run.status === "running" || run.status === "queued") {
      run.status = "failed";
      run.error = "The server restarted before this run finished.";
      run.finishedAt = new Date().toISOString();
    }
  await persist();
}
export function persist(): Promise<void> {
  const snapshot = JSON.stringify(state, null, 2);
  const next = pendingWrite
    .catch((error) => {
      process.stderr.write(
        `Previous persistence attempt failed: ${String(error)}\n`,
      );
    })
    .then(async () => {
      const temporary = path.join(dataDir, "store.tmp");
      await writeFile(temporary, snapshot, "utf8");
      await rename(temporary, path.join(dataDir, "store.json"));
    });
  pendingWrite = next;
  return next;
}
export function createScenario(seed: number, level: number): Scenario {
  const scenario: Scenario = {
    id: randomUUID(),
    seed,
    level,
    customers: ["Acme Robotics", "Globex Research", "Meridian Studio"],
    invoices: [],
  };
  state.scenarios.push(scenario);
  return scenario;
}
export function verifyScenario(
  scenario: Scenario,
  expected: InvoiceInputs,
  pdfValid: boolean,
): Check[] {
  const invoice = scenario.invoices[0];
  const expectedTotal = totalCents(expected.items) / 100;
  return [
    {
      label: "Exactly one invoice",
      expected: "1",
      actual: String(scenario.invoices.length),
      passed: scenario.invoices.length === 1,
    },
    {
      label: "Customer",
      expected: expected.customer,
      actual: invoice?.customer ?? "Missing",
      passed: invoice?.customer === expected.customer,
    },
    {
      label: "Line items",
      expected: JSON.stringify(expected.items),
      actual: invoice ? JSON.stringify(invoice.items) : "Missing",
      passed:
        !!invoice &&
        JSON.stringify(invoice.items) === JSON.stringify(expected.items),
    },
    {
      label: "Payment terms",
      expected: expected.terms,
      actual: invoice?.terms ?? "Missing",
      passed: invoice?.terms === expected.terms,
    },
    {
      label: "Invoice total",
      expected: `$${expectedTotal.toFixed(2)}`,
      actual: invoice ? `$${invoice.total.toFixed(2)}` : "Missing",
      passed: invoice?.total === expectedTotal,
    },
    {
      label: "PDF artifact",
      expected: "Valid PDF downloaded",
      actual:
        pdfValid && invoice?.pdfGenerated
          ? "Valid PDF downloaded"
          : "Not verified",
      passed: pdfValid && invoice?.pdfGenerated === true,
    },
  ];
}
