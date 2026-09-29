import { describe, expect, it } from "vitest";
import {
  compileSchema,
  compileWorkflow,
  sampleWorkflow,
} from "../server/compiler.js";
import {
  invoiceSchema,
  scenarioSchema,
  totalCents,
} from "../server/validation.js";
import { semanticNames } from "../server/runner.js";
import { verifyScenario } from "../server/store.js";
import { invoicePdf } from "../server/pdf.js";
import { EvidenceError, errorResponse } from "../server/errors.js";

describe("evidence compiler", () => {
  it("coalesces consecutive keystrokes while retaining every source event", () => {
    const workflow = sampleWorkflow();
    const index = workflow.events.findIndex(
      (event) => event.name === "Description 1",
    );
    const event = workflow.events[index];
    const events = [
      ...workflow.events.slice(0, index),
      { ...event, id: "partial", value: "Con" },
      ...workflow.events.slice(index),
    ];
    const compiled = compileWorkflow({ ...workflow, events });
    const step = compiled.steps.find(
      (candidate) => candidate.name === "Description 1",
    );
    expect(step?.value).toBe("Consulting");
    expect(step?.sourceEventIds).toEqual(["partial", event.id]);
  });
  it("preserves source evidence and creates a versioned, honestly labeled sample", () => {
    const workflow = sampleWorkflow();
    expect(workflow.source).toBe("sample");
    expect(
      workflow.steps.every((step) =>
        workflow.events.some((event) => step.sourceEventIds.includes(event.id)),
      ),
    ).toBe(true);
    expect(
      workflow.steps.find((step) => step.name === "Description 2")?.value,
    ).toBe("Cloud audit");
  });
  it("rejects incomplete demonstrations and mismatched business inputs", () => {
    const workflow = sampleWorkflow();
    expect(() =>
      compileWorkflow({ ...workflow, events: workflow.events.slice(0, -1) }),
    ).toThrow("exporting");
    expect(() =>
      compileWorkflow({
        ...workflow,
        inputs: {
          ...workflow.inputs,
          items: [{ description: "Wrong", quantity: 1, unitPrice: 1 }],
        },
      }),
    ).toThrow("evidence");
  });
  it("rejects arbitrary CSS selectors and unordered trace evidence", () => {
    const workflow = sampleWorkflow();
    expect(
      compileSchema.safeParse({
        name: workflow.name,
        inputs: workflow.inputs,
        events: [
          { ...workflow.events[0], selector: "body > *" },
          ...workflow.events.slice(1),
        ],
      }).success,
    ).toBe(false);
    expect(() =>
      compileWorkflow({ ...workflow, events: [...workflow.events].reverse() }),
    ).toThrow("ordered");
  });
});
describe("independent verification", () => {
  it("computes currency in cents and rejects unsupported precision", () => {
    expect(
      totalCents([{ description: "Test", quantity: 3, unitPrice: 0.1 }]),
    ).toBe(30);
    const inputs = sampleWorkflow().inputs;
    expect(
      invoiceSchema.safeParse({
        ...inputs,
        items: [{ description: "Test", quantity: 1, unitPrice: 0.001 }],
      }).success,
    ).toBe(false);
    expect(scenarioSchema.safeParse({ seed: -1, level: 4 }).success).toBe(
      false,
    );
  });
  it("requires a downloaded valid PDF and exact items even when the total matches", () => {
    const inputs = sampleWorkflow().inputs;
    const invoice = {
      ...inputs,
      id: "invoice",
      total: 1250,
      pdfGenerated: true,
    };
    const scenario = {
      id: "scenario",
      seed: 42,
      level: 4,
      customers: [inputs.customer],
      invoices: [invoice],
    };
    expect(
      verifyScenario(scenario, inputs, true).every((check) => check.passed),
    ).toBe(true);
    expect(
      verifyScenario(scenario, inputs, false).every((check) => check.passed),
    ).toBe(false);
    const wrong = {
      ...scenario,
      invoices: [
        {
          ...invoice,
          items: [{ description: "Other work", quantity: 1, unitPrice: 1250 }],
        },
      ],
    };
    expect(
      verifyScenario(wrong, inputs, true).find(
        (check) => check.label === "Line items",
      )?.passed,
    ).toBe(false);
  });
  it("generates a genuine PDF document", async () => {
    const pdf = await invoicePdf("example", sampleWorkflow().inputs);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(800);
    expect(pdf.toString().includes("%%EOF")).toBe(true);
  });
});
describe("semantic binding", () => {
  it("uses visible label aliases without receiving mutation seeds or selectors", () => {
    expect(semanticNames("Description 2")).toEqual([
      "Description 2",
      "Details 2",
    ]);
    expect(semanticNames("Customers")).toContain("Clients");
    expect(semanticNames("Acme Robotics")).toEqual(["Acme Robotics"]);
  });
});

describe("HTTP failure classification", () => {
  it("keeps compiler evidence failures actionable while hiding internal failures", () => {
    expect(
      errorResponse(new EvidenceError("Missing invoice evidence")),
    ).toEqual({ status: 400, message: "Missing invoice evidence" });
    expect(errorResponse(new Error("private file path"))).toEqual({
      status: 500,
      message: "An internal server error occurred. Check the server log.",
    });
    const invalid = scenarioSchema.safeParse({ seed: -1, level: 99 });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(errorResponse(invalid.error).status).toBe(400);
  });
  it("handles malformed JSON and oversized requests as client errors", () => {
    expect(
      errorResponse(
        Object.assign(new SyntaxError("bad input"), {
          type: "entity.parse.failed",
        }),
      ).status,
    ).toBe(400);
    expect(
      errorResponse(
        Object.assign(new Error("too big"), { type: "entity.too.large" }),
      ).status,
    ).toBe(413);
  });
});
