import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { TraceEvent, Workflow, WorkflowStep } from "../src/types.js";
import { invoiceSchema } from "./validation.js";
import { EvidenceError } from "./errors.js";

export const traceSchema = z
  .object({
    id: z.string().min(1).max(80),
    type: z.enum(["click", "input", "select"]),
    timestamp: z.number().finite().min(0),
    selector: z.string().regex(/^#[A-Za-z][A-Za-z0-9_-]*$/),
    role: z.enum(["button", "textbox", "searchbox", "spinbutton", "combobox"]),
    name: z.string().min(1).max(160),
    value: z.string().max(240).optional(),
  })
  .strict();
export const compileSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    inputs: invoiceSchema,
    events: z.array(traceSchema).min(8).max(500),
  })
  .strict();

export function compileWorkflow(
  rawData: Pick<Workflow, "name" | "inputs" | "events">,
  source: Workflow["source"] = "recorded",
): Workflow {
  const data = compileSchema.parse({
    name: rawData.name,
    inputs: rawData.inputs,
    events: rawData.events,
  });
  const events = data.events;
  if (new Set(events.map((event) => event.id)).size !== events.length)
    throw new EvidenceError("Trace event IDs must be unique.");
  if (
    events.some(
      (event, index) =>
        index > 0 && event.timestamp < events[index - 1].timestamp,
    )
  )
    throw new EvidenceError("Trace timestamps must be ordered.");
  const exportIndex = events.findIndex(
    (event) =>
      event.type === "click" && /^(export|download) pdf$/i.test(event.name),
  );
  const createIndex = events.findIndex(
    (event) =>
      event.type === "click" && /^(create|issue) invoice$/i.test(event.name),
  );
  if (createIndex < 0 || exportIndex <= createIndex)
    throw new EvidenceError(
      "Complete the demonstration by creating an invoice and exporting its PDF.",
    );
  if (
    !events.some(
      (event) => event.type === "click" && event.name === data.inputs.customer,
    )
  )
    throw new EvidenceError("The trace must select the requested customer.");
  for (const [index, item] of data.inputs.items.entries()) {
    for (const [field, value] of [
      ["description", item.description],
      ["quantity", item.quantity],
      ["unit price", item.unitPrice],
    ] as const) {
      if (
        !events.some(
          (event) =>
            event.type === "input" &&
            event.name ===
              `${field.charAt(0).toUpperCase() + field.slice(1)} ${index + 1}` &&
            event.value === String(value),
        )
      )
        throw new EvidenceError(
          `Trace is missing evidence for item ${index + 1} ${field}.`,
        );
    }
  }
  if (
    !events.some(
      (event) => event.type === "select" && event.value === data.inputs.terms,
    )
  )
    throw new EvidenceError("Trace is missing payment terms.");
  const normalized: { event: TraceEvent; evidence: string[] }[] = [];
  for (const event of events) {
    const previous = normalized[normalized.length - 1];
    if (
      event.type === "input" &&
      previous?.event.type === "input" &&
      previous.event.selector === event.selector
    ) {
      previous.event = event;
      previous.evidence.push(event.id);
    } else normalized.push({ event, evidence: [event.id] });
  }
  const steps: WorkflowStep[] = normalized.map(
    ({ event, evidence }, index) => ({
      id: `step-${index + 1}`,
      intent: `${event.type === "input" ? "Enter" : event.type === "select" ? "Set" : "Activate"} ${event.name}`,
      action:
        event.type === "input"
          ? "fill"
          : event.type === "select"
            ? "select"
            : "click",
      role: event.role,
      name: event.name,
      value: event.value,
      selector: event.selector,
      sourceEventIds: evidence,
    }),
  );
  return {
    id: randomUUID(),
    name: data.name,
    version: 1,
    createdAt: new Date().toISOString(),
    source,
    inputs: data.inputs,
    events,
    steps,
    specVersion: "semantic-workflow/v0.1",
    compiler: "local-evidence-rules/1.0",
  };
}

export function sampleWorkflow(): Workflow {
  const events: TraceEvent[] = [];
  const add = (
    type: TraceEvent["type"],
    selector: string,
    role: string,
    name: string,
    value?: string,
  ) =>
    events.push({
      id: `sample-${events.length + 1}`,
      type,
      selector,
      role,
      name,
      value,
      timestamp: events.length * 1000,
    });
  add("click", "#nav-customers", "button", "Customers");
  add("click", "#customer-acme", "button", "Acme Robotics");
  add("click", "#tab-billing", "button", "Billing");
  add("click", "#new-invoice", "button", "New invoice");
  const inputs = {
    customer: "Acme Robotics" as const,
    terms: "NET_30" as const,
    items: [
      { description: "Consulting", quantity: 3, unitPrice: 250 },
      { description: "Cloud audit", quantity: 1, unitPrice: 500 },
    ],
  };
  inputs.items.forEach((item, index) => {
    if (index > 0) add("click", "#add-item", "button", "Add line item");
    add(
      "input",
      `#description-${index}`,
      "textbox",
      `Description ${index + 1}`,
      item.description,
    );
    add(
      "input",
      `#quantity-${index}`,
      "spinbutton",
      `Quantity ${index + 1}`,
      String(item.quantity),
    );
    add(
      "input",
      `#price-${index}`,
      "spinbutton",
      `Unit price ${index + 1}`,
      String(item.unitPrice),
    );
  });
  add("select", "#payment-terms", "combobox", "Payment terms", "NET_30");
  add("click", "#save-invoice", "button", "Create invoice");
  add("click", "#export-pdf", "button", "Export PDF");
  return compileWorkflow(
    { name: "Create & export customer invoice", inputs, events },
    "sample",
  );
}
