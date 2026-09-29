# Architecture

Once contains a React interface, a synthetic CRM, an Express control plane, and a local Playwright executor. The executor performs browser actions. A separate verifier inspects saved business state after execution.

## Optional AWS execution

`server/bedrock.ts` uses Converse to enrich validated recorded steps with business intents and resolve each semantic action against the current visible accessible controls. Model output cannot change recorded values, action order, or provenance. Exact role/name selections must occur uniquely in the observed candidate list. Model calls have bounded output tokens and a 40-second timeout. This code is tested at its validation boundaries; live Nova inference is blocked by account authorization as of September 29, 2026.

`server/browser-agentcore.ts` starts a five-minute managed Browser session, signs its CDP connection, uses its default browser context, and attempts session cleanup in all exit paths. The remote browser receives the local Northstar fixture through an intercepted, allowlisted synthetic origin. Only built assets and the current scenario's business endpoints are forwarded. Workflow and run control endpoints are excluded. Both literal and semantic modes use the same browser adapter. The control plane and artifacts remain local; this is not a public AWS deployment.

## Components

| Component              | Responsibility                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/App.tsx`          | Workflow library, demonstration capture, mutation lab, run history, and evidence views                 |
| `src/Northstar.tsx`    | Synthetic customer and invoice interface with cumulative UI mutations                                  |
| `src/types.ts`         | Shared trace, workflow, scenario, invoice, and run shapes                                              |
| `server/index.ts`      | Validated API endpoints, run admission, PDF downloads, and static hosting                              |
| `server/compiler.ts`   | Trace validation, invoice evidence checks, input-event compaction, and versioned workflow construction |
| `server/runner.ts`     | Browser lifecycle, target binding, actions, downloads, screenshots, and run outcomes                   |
| `server/store.ts`      | Local persistence, isolated scenario creation, and business verification                               |
| `server/pdf.ts`        | Invoice PDF generation                                                                                 |
| `server/validation.ts` | Input schemas and integer-cent total calculation                                                       |

## Demonstration to execution

1. The dashboard creates a fresh L0 scenario and embeds Northstar in a same-origin iframe.
2. Northstar records clicks, field inputs, and selections with a timestamp, target selector, role, visible name, and value. Submission captures current form values so untouched defaults are represented.
3. Messages return to the dashboard through `postMessage`. The dashboard checks both the sender origin and the iframe window. After PDF export, it enables compilation with the completed invoice inputs.
4. The server validates the trace and its invoice evidence. Consecutive edits to the same field are compacted while retaining their source event IDs. Each compiled step keeps a role/name target and a literal selector for comparison.
5. A run receives a new scenario with the chosen seed and level. Local mode opens a fresh Playwright browser context. AgentCore mode starts a managed browser session and uses its existing context.
6. Literal execution binds each step to its recorded selector. Default semantic execution binds to the visible accessible role and a name from the supported synonym list. With Bedrock enabled, semantic execution asks the model to choose from observed visible controls and validates the exact role/name before acting. All modes perform the same fill, select, and click operations.
7. The runner saves intermediate screenshots every three actions, the real PDF download, and a final screenshot. The verifier checks exactly one invoice, customer, line items, payment terms, total, and PDF evidence. A run passes only when execution has no error and every check passes.

The current compiler retains the demonstration's action order and values. Its intents are deterministic descriptions of those actions. It does not infer a general business plan, learn a policy, or re-plan after a changed flow.

## State and isolation

Each scenario has its own customer fixture and invoice collection. Previews, demonstrations, and runs use distinct scenario IDs. Northstar allows one invoice per scenario. The control plane admits one execution at a time.

State is held in memory and persisted to `.data/store.json` through serialized writes and temporary-file renames. Artifact files are stored under `.data/artifacts`. Startup marks interrupted queued/running executions as failed. This storage model supports one trusted local server process; it is not a concurrent database or a production tenancy boundary.

## Execution boundary

The browser navigates only to `ONCE_WEB_ORIGIN` and blocks network requests to other origins. The API binds to `127.0.0.1`, validates supported inputs, and rejects cross-origin writes from unrecognized browser origins. There is no authentication layer.

The executor uses browser locators and does not call verifier internals or inspect scenario invoice data to choose actions. The verifier is ordinary server code and has no browser-accessible evaluation endpoint. The synthetic app's own data API still exists to render its UI; this local arrangement is not adversarial isolation against a malicious browser agent.

Runs have bounded waits and a 90-second limit, and browser cleanup occurs in the execution finalizer. Screenshots provide intermediate and final-state evidence; the UI polls for updates. PDF validation establishes a downloaded PDF-shaped artifact; it does not parse the document to independently verify its textual contents.

## Mutations and evaluation

L1 changes the theme. L2 hashes actual element IDs using the seed. L3 changes navigation and layout order. L4 substitutes a fixed set of visible labels. Levels are cumulative. Neither hidden semantic IDs nor the mutation level are used by semantic target binding.

The checked-in smoke experiments cover L0, L2, and L4 plus a newly recorded invoice with different inputs. The UI supports paired comparisons at every level. Results describe this constrained fixture and synonym vocabulary; they do not establish general browser-agent reliability.

## Cloud integration boundary

The optional Bedrock and AgentCore adapters are implemented, but have not completed a live end-to-end run. The configured AWS account returned `NOT_AUTHORIZED` for Nova Lite and an applied AgentCore Browser session quota of zero on September 29, 2026. Validation tests establish only local code behavior at the model-output and fixture-bridge boundaries. They do not establish that the managed services can run this workflow.

The AgentCore browser accesses the current Northstar scenario through a scoped local fixture bridge. The bridge serves the built application and permitted scenario endpoints at a synthetic origin; it excludes workflow and run control APIs. The Express control plane, JSON state, and artifacts stay on the developer's machine. A public deployment needs separate infrastructure, identity and access controls, persistent storage, and live cloud verification. The current loopback server is not a public hosting configuration.
