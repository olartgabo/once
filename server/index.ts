import express from "express";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { errorResponse } from "./errors.js";
import type { Run } from "../src/types.js";
import { compileSchema, compileWorkflow } from "./compiler.js";
import { invoiceSchema, scenarioSchema, totalCents } from "./validation.js";
import {
  artifactsDir,
  createScenario,
  initializeStore,
  persist,
  state,
} from "./store.js";
import { invoicePdf } from "./pdf.js";
import { executeRun } from "./runner.js";
import { bedrockConfiguration, enrichWorkflow } from "./bedrock.js";
import { createPostLimiter, publicDemoFull } from "./public-demo.js";

await initializeStore();
const app = express();
const publicDemo = process.env.ONCE_PUBLIC_DEMO === "1";
const allowPost = createPostLimiter();
app.disable("x-powered-by");
app.use(express.json({ limit: "128kb" }));
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (
    req.method !== "GET" &&
    origin &&
    origin !== `http://${req.get("host")}` &&
    origin !== `https://${req.get("host")}` &&
    origin !==
      new URL(process.env.ONCE_WEB_ORIGIN || "http://localhost:5173").origin
  ) {
    res.status(403).json({ error: "Cross-origin writes are disabled." });
    return;
  }
  next();
});
if (publicDemo)
  app.use((req, res, next) => {
    if (req.method === "POST" && !allowPost()) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "Demo is busy. Retry in a minute." });
      return;
    }
    next();
  });
function atCapacity(
  resource: "workflows" | "scenarios" | "runs",
  count: number,
  res: express.Response,
) {
  if (!publicDemo || !publicDemoFull(resource, count)) return false;
  res.status(503).json({
    error: `Public demo ${resource} capacity reached. The demo data must be reset before creating more.`,
  });
  return true;
}
app.get("/api/health", (_req, res) =>
  res.json({
    browser: process.env.ONCE_BROWSER === "agentcore" ? "agentcore" : "local",
    cloud: process.env.ONCE_BROWSER === "agentcore",
    compiler:
      process.env.ONCE_BEDROCK === "1"
        ? "bedrock-converse"
        : "local-evidence-rules/1.0",
    model:
      process.env.ONCE_BEDROCK === "1" ? bedrockConfiguration.modelId : null,
    region: process.env.AWS_REGION || "us-east-1",
  }),
);
app.get("/api/workflows", (_req, res) => res.json(state.workflows));
let pendingWorkflows = 0;
app.post("/api/workflows", async (req, res) => {
  const data = compileSchema.parse(req.body);
  const compiled = compileWorkflow(data);
  if (atCapacity("workflows", state.workflows.length + pendingWorkflows, res))
    return;
  pendingWorkflows += 1;
  try {
    const workflow =
      process.env.ONCE_BEDROCK === "1"
        ? await enrichWorkflow(compiled)
        : compiled;
    state.workflows.unshift(workflow);
    await persist();
    res.status(201).json(workflow);
  } finally {
    pendingWorkflows -= 1;
  }
});
app.get("/api/runs", (_req, res) => res.json([...state.runs].reverse()));
app.get("/api/runs/:id", (req, res) => {
  const run = state.runs.find((candidate) => candidate.id === req.params.id);
  if (!run) {
    res.status(404).json({ error: "Run not found." });
    return;
  }
  res.json(run);
});
let busy = false;
app.post("/api/runs", async (req, res) => {
  if (
    atCapacity("runs", state.runs.length, res) ||
    atCapacity("scenarios", state.scenarios.length, res)
  )
    return;
  const body = scenarioSchema
    .extend({
      workflowId: z.string().uuid(),
      mode: z.enum(["semantic", "literal"]),
    })
    .parse(req.body);
  if (busy) {
    res.status(409).json({
      error: "A browser run is already active. Wait for it to finish.",
    });
    return;
  }
  const workflow = state.workflows.find(
    (candidate) => candidate.id === body.workflowId,
  );
  if (!workflow) {
    res.status(404).json({ error: "Workflow not found." });
    return;
  }
  busy = true;
  const scenario = createScenario(body.seed, body.level);
  const run: Run = {
    id: randomUUID(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    mode: body.mode,
    seed: body.seed,
    level: body.level,
    status: "queued",
    startedAt: new Date().toISOString(),
    events: [],
    checks: [],
    scenarioId: scenario.id,
  };
  state.runs.push(run);
  try {
    await persist();
  } catch (error) {
    busy = false;
    throw error;
  }
  res.status(202).json(run);
  void executeRun(run, workflow)
    .catch(async (error) => {
      run.status = "failed";
      run.error = error instanceof Error ? error.message : String(error);
      run.finishedAt = new Date().toISOString();
      process.stderr.write(`Run ${run.id}: ${run.error}\n`);
      try {
        await persist();
      } catch (persistError) {
        process.stderr.write(
          `Could not persist failed run: ${String(persistError)}\n`,
        );
      }
    })
    .finally(() => {
      busy = false;
    });
});
app.post("/api/scenarios", async (req, res) => {
  if (atCapacity("scenarios", state.scenarios.length, res)) return;
  const body = scenarioSchema.parse(req.body);
  const scenario = createScenario(body.seed, body.level);
  await persist();
  res.status(201).json(scenario);
});
app.get("/api/scenarios/:id", (req, res) => {
  const scenario = state.scenarios.find(
    (candidate) => candidate.id === req.params.id,
  );
  if (!scenario) {
    res.status(404).json({ error: "Scenario not found." });
    return;
  }
  res.json(scenario);
});
app.post("/api/scenarios/:id/invoices", async (req, res) => {
  const data = invoiceSchema.parse(req.body);
  const scenario = state.scenarios.find(
    (candidate) => candidate.id === req.params.id,
  );
  if (!scenario) {
    res.status(404).json({ error: "Scenario not found." });
    return;
  }
  if (scenario.invoices.length) {
    res
      .status(409)
      .json({ error: "An invoice already exists in this isolated scenario." });
    return;
  }
  const invoice = {
    ...data,
    id: randomUUID(),
    total: totalCents(data.items) / 100,
    pdfGenerated: false,
  };
  scenario.invoices.push(invoice);
  await persist();
  res.status(201).json(invoice);
});
app.get("/api/scenarios/:id/invoices/:invoiceId/pdf", async (req, res) => {
  const scenario = state.scenarios.find(
    (candidate) => candidate.id === req.params.id,
  );
  const invoice = scenario?.invoices.find(
    (candidate) => candidate.id === req.params.invoiceId,
  );
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found." });
    return;
  }
  const pdf = await invoicePdf(invoice.id, invoice);
  invoice.pdfGenerated = true;
  await persist();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="northstar-${invoice.id}.pdf"`,
  );
  res.send(pdf);
});
app.use(
  "/artifacts",
  express.static(artifactsDir, { dotfiles: "deny", index: false }),
);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
app.use(express.static(path.resolve("dist")));
app.get("/{*path}", (_req, res) =>
  res.sendFile(path.resolve("dist/index.html")),
);
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const { status, message } = errorResponse(error);
    if (status === 500)
      process.stderr.write(
        `${JSON.stringify({ event: "server.error", message: error instanceof Error ? error.message : String(error) })}\n`,
      );
    res.status(status).json({ error: message });
  },
);
const port = Number(process.env.PORT || 3001);
const host = process.env.ONCE_HOST || (publicDemo ? "0.0.0.0" : "127.0.0.1");
if (!publicDemo && !["127.0.0.1", "localhost", "::1"].includes(host))
  throw new Error("Set ONCE_PUBLIC_DEMO=1 before binding outside loopback.");
app.listen(port, host, () =>
  process.stdout.write(`Once API ready at http://${host}:${port}\n`),
);
