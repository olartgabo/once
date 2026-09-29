import { describe, expect, it } from "vitest";
import {
  applyBedrockIntents,
  validateBedrockTarget,
} from "../server/bedrock.js";
import { sampleWorkflow } from "../server/compiler.js";

describe("Bedrock response boundaries", () => {
  it("changes only intent text and compiler metadata", () => {
    const workflow = sampleWorkflow();
    const enriched = applyBedrockIntents(workflow, {
      steps: workflow.steps.map((step) => ({
        id: step.id,
        intent: `Business purpose for ${step.id}`,
      })),
    });
    expect(enriched.compiler).toContain("bedrock-converse/");
    expect(enriched.steps.map(({ intent: _intent, ...step }) => step)).toEqual(
      workflow.steps.map(({ intent: _intent, ...step }) => step),
    );
    expect(enriched.inputs).toEqual(workflow.inputs);
    expect(enriched.events).toEqual(workflow.events);
    expect(workflow.compiler).toBe("local-evidence-rules/1.0");
  });
  it("rejects missing, duplicate, invented, or action-changing steps", () => {
    const workflow = sampleWorkflow();
    const steps = workflow.steps.map((step) => ({
      id: step.id,
      intent: "Create the invoice",
    }));
    expect(() =>
      applyBedrockIntents(workflow, { steps: steps.slice(1) }),
    ).toThrow();
    expect(() =>
      applyBedrockIntents(workflow, { steps: [...steps.slice(1), steps[1]] }),
    ).toThrow();
    expect(() =>
      applyBedrockIntents(workflow, {
        steps: [{ ...steps[0], id: "invented" }, ...steps.slice(1)],
      }),
    ).toThrow();
    expect(() =>
      applyBedrockIntents(workflow, {
        steps: [{ ...steps[0], action: "delete" }, ...steps.slice(1)],
      }),
    ).toThrow();
  });
  it("rejects unobserved and ambiguous target selections", () => {
    const candidate = { role: "button" as const, name: "Issue invoice" };
    expect(validateBedrockTarget(candidate, [candidate])).toEqual(candidate);
    expect(() =>
      validateBedrockTarget({ role: "button", name: "Delete invoice" }, [
        candidate,
      ]),
    ).toThrow();
    expect(() =>
      validateBedrockTarget(candidate, [candidate, candidate]),
    ).toThrow();
    expect(() =>
      validateBedrockTarget({ ...candidate, selector: "#private" }, [
        candidate,
      ]),
    ).toThrow();
  });
});
