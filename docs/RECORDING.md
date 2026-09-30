# Once demo recording

Record a 2–3 minute product walkthrough at 1440 × 900 or larger. Hide notifications and keep the browser at 100% zoom. Use synthetic customer data.

The source walkthrough uses the public AWS application at https://tpuqe8scax.us-east-1.awsapprunner.com. The scripted recorder performs real UI actions, requires the observed L4 outcomes, and downloads the successful run's PNG/PDF evidence. The original source has captions, no voiceover, and no cuts. The final narrated edit uses the owner's MP3, fresh footage without overlays, synchronized captions, and Remotion animations. It is 1920 x 1080 at 30 fps and approximately 2 minutes 9 seconds. See [the Remotion project](../video/README.md) for preview and rendering instructions. Final artifacts and metadata are under `artifacts/live-video`; the release download links are in [SUBMISSION.md](SUBMISSION.md).

1. **0:00–0:15 — Problem.** Show Once's workflow library. Say: “A recorded click sequence can break when an interface changes. Once lets us compare selector replay with semantic target selection using the same task.”
2. **0:15–0:55 — Demonstration.** Choose New demonstration. Select Globex Research, open Billing, create an invoice with Architecture review: quantity 2 at $400, and Security assessment: quantity 1 at $900. Set Net 15, create it, then export its PDF. Name the workflow “Globex invoice and PDF” and save it.
3. **0:55–1:15 — Inspect.** Show the captured trace and compiled specification. Point out the original events, typed values, and compiler identifier. Say: “Each step retains its demonstration evidence.”
4. **1:15–2:00 — Comparison.** Open Mutation lab, choose seed 48219 and L4 rewritten labels. Compare both methods. Show the actual outcomes: selector replay is expected to fail after IDs change; semantic execution must actually pass before recording a success claim. Trim waiting time transparently if needed.
5. **2:00–2:30 — Evidence.** Open the successful run. Show the six business checks, intermediate screenshots, final screenshot, and the $1,700 PDF with Net 15 terms.
6. **2:30–2:50 — Architecture and scope.** Show Settings and the editable diagram in docs/diagrams/once-deployment.drawio. Describe the runtime actually used. The control plane, Northstar fixture, Chromium browser, and ephemeral evidence storage run together on AWS App Runner. The optional AWS path uses AgentCore Browser and Bedrock, but requires a successful live verification before presenting it as working.

## Reproduce the hosted recording

```bash
docker run --rm --network host --user "$(id -u):$(id -g)" \
  -e ONCE_API_ORIGIN=https://tpuqe8scax.us-east-1.awsapprunner.com \
  -e ONCE_VIDEO_DIR=artifacts/live-video -v "$PWD:/app" -w /app \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run record:demo
```

The hosted executor uses accessible roles and predefined equivalent labels. Managed Bedrock and AgentCore integration remains unverified and is not presented as working. Keep failed runs in the evidence and inspect the actual recorded outcome.

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
