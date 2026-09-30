# Once submission handoff

The project uses branch `codex/once` in https://github.com/olartgabo/once. The public AWS application is https://tpuqe8scax.us-east-1.awsapprunner.com. Read [submission copy](docs/SUBMISSION.md), [verification](docs/VERIFICATION.md), and [deployment procedure](docs/DEPLOYMENT.md) for the release record.

## Release scope

React, Express, the synthetic Northstar invoice fixture, deterministic trace compiler, and Playwright Chromium run together on one AWS App Runner instance. ECR stores the immutable container, and CloudFormation manages stack `once-demo-service-v2`. Public mode bounds traffic and stored records. History and artifacts are shared and ephemeral across instance replacement.

The compiler retains recorded action order and values. Semantic binding uses accessible roles and predefined equivalent labels. Bedrock and AgentCore adapters remain disabled and live-unverified. The historical Nova authorization, AgentCore quota, CodeBuild queue, and CloudFront account-verification failures are in [AWS-ACCESS-BLOCKERS.md](docs/AWS-ACCESS-BLOCKERS.md). No AWS Support case was submitted.

## Verification and evidence

Typecheck, 17 unit tests, build, dependency audit, production-container sample checks, and actual UI-recording checks passed. Final public measurements and downloadable release evidence are documented in [VERIFICATION.md](docs/VERIFICATION.md). [CODING-AGENT-PROOF.md](docs/CODING-AGENT-PROOF.md) records the console-authenticated agent connection and real AWS operations without credential values.

## Operations

AWS CLI is installed under `~/.local/bin`; use a fresh `aws login --profile codex-login` if the short-lived session expires. Region is `us-east-1`, account `733366527874`. Do not copy credential files or log tokens. The release script uses a temporary Docker config and clears its ECR login.

Build with `ONCE_BUILD_NETWORK=host bash deploy/linux-release.sh` on this Linux host, where Docker bridge DNS failed. Use a fresh image tag. Preserve evidence before replacing the App Runner instance. Do not delete `once-demo-build` without inspecting its retained source bucket and images. Failed `once-demo-web` and `once-demo-service` stack records are retained as error evidence.

## Submission

The AWS Zero to Shipped deadline is October 2, 2026, 11:59 PM PDT. Use one category, Workplace Efficiency, and one focus track, Community. The final Builder Center publication is the owner's account action; project copy, public demo, video, source, and connection proof are prepared in the linked documents. No managed AI success or arbitrary website reliability is claimed.
