export type InvoiceInputs = {
  customer: string;
  terms: "NET_15" | "NET_30" | "NET_60";
  items: { description: string; quantity: number; unitPrice: number }[];
};
export type TraceEvent = {
  id: string;
  type: "click" | "input" | "select";
  timestamp: number;
  selector: string;
  role: string;
  name: string;
  value?: string;
};
export type WorkflowStep = {
  id: string;
  intent: string;
  action: "click" | "fill" | "select";
  role: string;
  name: string;
  value?: string;
  selector: string;
  sourceEventIds: string[];
};
export type Workflow = {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  source: "sample" | "recorded";
  inputs: InvoiceInputs;
  events: TraceEvent[];
  steps: WorkflowStep[];
  specVersion: string;
  compiler: string;
};
export type Check = {
  label: string;
  expected: string;
  actual: string;
  passed: boolean;
};
export type RunEvent = {
  time: string;
  step: string;
  message: string;
  status: "running" | "passed" | "failed";
  screenshot?: string;
};
export type Run = {
  id: string;
  workflowId: string;
  workflowName: string;
  mode: "semantic" | "literal";
  seed: number;
  level: number;
  status: "queued" | "running" | "passed" | "failed";
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  events: RunEvent[];
  checks: Check[];
  error?: string;
  screenshot?: string;
  scenarioId: string;
  pdfUrl?: string;
};
export type Invoice = InvoiceInputs & {
  id: string;
  total: number;
  pdfGenerated: boolean;
};
export type Scenario = {
  id: string;
  seed: number;
  level: number;
  customers: string[];
  invoices: Invoice[];
};
