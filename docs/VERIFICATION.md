# Submission verification

Verified on Linux on September 29, 2026 (September 30 UTC). The production Docker container and public AWS App Runner endpoint were checked separately. The executor is Playwright Chromium inside the AWS-hosted container. These results do not establish Bedrock or AgentCore success. The health fields `browser: local` and `cloud: false` identify the Chromium adapter rather than the hosting location; the application itself is hosted on App Runner.

## Completed checks

- TypeScript typecheck and production Vite build passed.
- Four unit-test files, 17 tests passed with Vitest 4.1.11.
- Full `npm audit` and production-only audit reported zero advisories after the Vitest upgrade.
- The image uses Playwright v1.63.0 and bundled Chromium, runs as `pwuser`, and removes development dependencies after building. `tsx` is a runtime dependency.
- Sample smoke: semantic L0/L2/L4 and literal L0 passed six business checks each. Literal L2/L4 failed as expected.
- Recording smoke: 20 recorded events compiled to 20 steps; Globex Research, $1,700, Net 15; semantic L4 passed six business checks, including the untouched quantity of one.
- Smoke and benchmark checks downloaded final and intermediate PNGs and successful-run PDFs, checked HTTP responses and file signatures, and required all six business checks for successful runs.
- The final public HTTPS app required no app login; sample and custom-recording smoke passed on the deployed image.
- AWS CLI 2.37.6 authenticated interactively through `aws login`; STS confirmed the expected account. CloudFormation stack outputs were read, the image was pushed to ECR, and AWS pre-deployment validation was exercised.

## Repeatable fixture benchmark on the public AWS app

`npm run benchmark`, seeds `48219`, `9042`, `20260929`, one sample invoice execution per mode/seed/level. N=30 total, n=3 per cell.

| Level | Literal replay passed | Semantic binding passed |
| ----- | --------------------- | ----------------------- |
| L0    | 3/3                   | 3/3                     |
| L1    | 3/3                   | 3/3                     |
| L2    | 0/3                   | 3/3                     |
| L3    | 0/3                   | 3/3                     |
| L4    | 0/3                   | 3/3                     |
| Total | 6/15                  | 15/15                   |

The seeds change element IDs only. Theme, layout, and label substitutions are fixed. Semantic binding uses a predefined equivalent-label vocabulary. These measurements demonstrate the supported fixture and do not estimate reliability on arbitrary websites or workflows. No retries were used to replace failed outcomes. The public benchmark independently reproduced the local results. Raw public runs, timestamps, runtime settings, durations, checks, and artifact paths are committed in [evidence/public-benchmark.json](evidence/public-benchmark.json). Downloaded public artifact bytes are preserved in the release evidence archive. The separate local report remains `artifacts/benchmark.json`.

## Deployment validation and evidence

The App Runner template initially exceeded the scaling-name limit and referred to a nonexistent IAM managed policy. Both were corrected. Local cfn-lint 1.57.1 reported no findings. AWS guard 3.2.1 with the AWS rules registry reported no failing applicable rules; most registry rules do not apply to this small template. AWS pre-deployment validation passed after the name correction. Failed change sets and stack events are preserved in `artifacts`.

The npm audit covers JavaScript dependencies. ECR basic scanning covers supported operating-system packages; neither guarantees the absence of vulnerabilities in bundled Chromium or all application behavior. Available OS updates were applied and unused multimedia libraries removed. The final ECR basic scan completed with zero findings for `demo-20260930-linux-4`, digest `sha256:51eb09f39be0a1075522ba88eb0fc9c1fca4931d45628a0c75eb3e4b22e2c159`. The initial image had 25 critical and 248 high findings; those initial scan results remain separate development evidence. Native CloudTrail event history recorded the actual App Runner creation; no separate trail was provisioned.

## Evidence locations

- `artifacts/aws-identity.json`, `build-stack-outputs.json`: authenticated agent connection and infrastructure evidence; contain no credentials.
- `artifacts/final-ecr-image.json`, `final-ecr-scan.json`: final uploaded image and OS scan.
- `artifacts/final-service-events.json`, `final-service-operations.json`: completed release deployment events.
- `artifacts/benchmark.json`, `container-data`, `baseline-data`: raw local execution evidence.
- `artifacts/live-video/`: captioned public-app recording, verification screenshot, runtime settings, and workflow/run metadata.

The local MP4 is retained separately as development evidence. The final video uses the public HTTPS application, a fresh browser context, actual UI recording and comparison actions, and captions. The architecture diagram is available as SVG, PNG, and editable draw.io under `docs/diagrams/once-deployment.*`.

Generated artifacts are intentionally excluded from Git. The submission release preserves source, selected evidence, raw public runs, downloaded PNG/PDF bytes, and the final live video. See [SUBMISSION.md](SUBMISSION.md) for downloads.
