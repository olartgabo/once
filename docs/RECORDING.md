# Once demo recording

Record a 2–3 minute product walkthrough at 1440 × 900 or larger. Hide notifications and keep the browser at 100% zoom. Use synthetic customer data.

1. **0:00–0:15 — Problem.** Show Once's workflow library. Say: “A recorded click sequence can break when an interface changes. Once lets us compare selector replay with semantic target selection using the same task.”
2. **0:15–0:55 — Demonstration.** Choose New demonstration. Select Globex Research, open Billing, create an invoice with Architecture review: quantity 2 at $400, and Security review: quantity 1 at $900. Set Net 15, create it, then export its PDF. Name the workflow “Globex invoice and PDF” and save it.
3. **0:55–1:15 — Inspect.** Show the captured trace and compiled specification. Point out the original events, typed values, and compiler identifier. Say: “Each step retains its demonstration evidence.”
4. **1:15–2:00 — Comparison.** Open Mutation lab, choose seed 48219 and L4 rewritten labels. Compare both methods. Show the actual outcomes: selector replay is expected to fail after IDs change; semantic execution must actually pass before recording a success claim. Trim waiting time transparently if needed.
5. **2:00–2:30 — Evidence.** Open the successful run. Show the six business checks, intermediate screenshots, final screenshot, and the $1,700 PDF with Net 15 terms.
6. **2:30–2:50 — Architecture and scope.** Show Settings and the editable diagram in docs/diagrams/once-architecture.drawio. Describe the runtime actually used. The control plane, Northstar fixture, and evidence storage are local. The optional AWS path uses AgentCore Browser and Bedrock, but requires a successful live verification before presenting it as working.

## Recording gate

Current AWS blockers are recorded in [AWS-ACCESS-BLOCKERS.md](AWS-ACCESS-BLOCKERS.md). Nova is NOT_AUTHORIZED, and AgentCore's applied browser-session quota is zero. Both live AWS checks failed; record local prototype behavior until access is resolved.

Use the local prototype if AWS access remains blocked, and call it a local prototype. Local semantic mode uses a predefined equivalent-label vocabulary. Bedrock mode chooses from observed accessible controls; it still follows the recorded action order and does not learn a general policy. Do not describe local results as cloud or model results.

AWS Toolkit and draw.io MCP are installed. A new Codex session is needed to expose the newly configured MCP tools. Cloud integration code alone is not evidence of cloud execution. Keep failed runs in the history and record the run you actually inspect.

## AWS launch after access is verified

```powershell
npm run build
$env:AWS_PROFILE = 'codex-login'
$env:AWS_REGION = 'us-east-1'
$env:ONCE_BROWSER = 'agentcore'
$env:ONCE_BEDROCK = '1'
$env:ONCE_WEB_ORIGIN = 'http://localhost:3001'
npm start
```

Stop the existing API server before starting another on port 3001. Open http://localhost:3001. A cloud run is bounded to five minutes and attempts to stop its AgentCore session afterward. Keep the local server running: it provides the scoped fixture bridge to the remote browser.
