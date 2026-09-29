# Once: Linux Codex handoff

Last updated September 29, 2026. Continue on branch `codex/once` from `https://github.com/olartgabo/once.git`. Read this file, [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and [docs/AWS-ACCESS-BLOCKERS.md](docs/AWS-ACCESS-BLOCKERS.md) before acting. The Windows checkout's `.once-handoff.md` is deliberately ignored and is not part of this remote handoff.

## Goal and current truth

Once is a synthetic browser workflow demo for the [AWS Zero to Shipped hackathon](https://builder.aws.com/build/hackathons/e83e84e5-4f4c-383b-bbe9-4a15ac195d55/zero-to-shipped?tab=rules). The official submission deadline is October 2, 2026, 11:59 PM PDT. The ship gate requires a live public AWS URL and proof that a coding agent connected to the AWS console. The user will research AWS account restrictions and handle any AWS Support case; do not submit one for them.

The local app works, but it is **not yet ready to submit**. Local recording, workflow compilation, Playwright execution, mutation comparison, PDFs, screenshots, and business verification exist. Bedrock and AgentCore adapters compile but have never completed a live cloud run. No public URL or final video exists. Do not describe local semantic success as cloud or model success.

## Verified on Windows before push

- `npm run typecheck`: passed.
- `npm test`: 4 files, 17 tests passed.
- `npm run build`: passed after running outside a restricted Windows sandbox. Vite emitted approximately 293 kB JS and 49 kB CSS. Re-run after checkout.
- Prior `npm run smoke`: semantic L0/L2/L4 and literal L0 passed six business checks; literal L2/L4 failed as expected when selectors changed. Prior `npm run smoke:recording` recorded a custom Globex invoice and passed semantic L4. These smoke checks predate the public-mode caps and the latest runner deadline fix; re-run them on Linux.
- CloudFormation validated `deploy/build-stack.yml`, `deploy/service-stack.yml`, and `deploy/ec2-demo-stack.yml` against AWS. The public EC2/CloudFront stack could not deploy because CloudFront says the account must be verified.
- `npm audit --omit=dev` reported zero production advisories. Full `npm audit` reported two moderate advisories in `vitest` / `@vitest/mocker` development dependencies. No force upgrade was applied.

## AWS account state

Windows profile `codex-login`, account `733366527874`, Region `us-east-1`. Use a fresh authenticated Linux profile or role; do not copy Windows credential files. AWS CLI access worked on September 29. The account currently reports:

- Nova Lite `NOT_AUTHORIZED`; Converse returns `ValidationException: Operation not allowed`.
- AgentCore Browser applied concurrency quota `0`; StartBrowserSession returns max sessions exceeded; no sessions exist.
- CodeBuild cannot start a build because the account permits `0` queued builds.
- CloudFront distribution creation returns HTTP 403: account verification required.

`once-demo-build` is a live CloudFormation stack with a private S3 source bucket, an empty ECR repository, and a CodeBuild project. Its source archive was uploaded to `s3://once-demo-build-sourcebucket-2s3es6vf1xzw/once-source.zip`; CodeBuild never ran. The `once-demo-web` attempt reached `ROLLBACK_COMPLETE` after CloudFront rejected creation. Every resource, including its EC2 instance, is `DELETE_COMPLETE`; its failed stack record remains as error evidence. Do not delete `once-demo-build` without checking its retained bucket and source archive.

## Linux path with Docker

The preferred next deployment path is to build locally on Linux, push to the existing private ECR repository, and deploy `deploy/service-stack.yml` to App Runner. This avoids CodeBuild and CloudFront. App Runner creates its own public HTTPS URL, but account eligibility for App Runner is unverified. Validate the container locally before pushing. The image must use the pinned Playwright base and include the Chromium executable. The App Runner service has one instance, no application AWS role, and `ONCE_PUBLIC_DEMO=1`; its local state is ephemeral across instance replacement.

```bash
aws sts get-caller-identity --profile codex-login
aws cloudformation describe-stacks --stack-name once-demo-build --profile codex-login --region us-east-1 --query 'Stacks[0].Outputs'
docker build -t once:demo .
docker run --rm -p 3001:3001 once:demo
# In another shell: ONCE_API_ORIGIN=http://localhost:3001 npm run smoke
aws ecr get-login-password --profile codex-login --region us-east-1 | docker login --username AWS --password-stdin 733366527874.dkr.ecr.us-east-1.amazonaws.com
docker tag once:demo 733366527874.dkr.ecr.us-east-1.amazonaws.com/once-demo-build-imagerepository-0s79nc7bfwac:demo-20260929
docker push 733366527874.dkr.ecr.us-east-1.amazonaws.com/once-demo-build-imagerepository-0s79nc7bfwac:demo-20260929
aws cloudformation deploy --template-file deploy/service-stack.yml --stack-name once-demo-service --capabilities CAPABILITY_IAM --parameter-overrides ImageUri=733366527874.dkr.ecr.us-east-1.amazonaws.com/once-demo-build-imagerepository-0s79nc7bfwac:demo-20260929 --profile codex-login --region us-east-1
```

Use a new image tag for any rebuild. The `Dockerfile` starts the Express API on port 3001 and serves the built frontend from `dist`. `ONCE_WEB_ORIGIN` points the browser inside the container at loopback; judge traffic arrives at App Runner's HTTPS URL. After deployment, inspect the CloudFormation `PublicUrl` output, open `/api/health`, then run `ONCE_API_ORIGIN=<PublicUrl> npm run smoke`. Test the full UI in a private browser window and inspect screenshots/PDFs. A public URL alone is insufficient evidence of a working demo.

If App Runner is also blocked, investigate account verification with the user before building another public service. Do not claim the ship gate passed until an external HTTPS URL and complete run are verified.

## Work still needed before submission

1. Resolve the account restrictions with the user. Recheck Bedrock and AgentCore only after an account-side change; avoid repeating the known failures.
2. Deploy a public app, verify a fresh browser can complete the invoice flow, and capture a real live run. The proven local executor can be an honest fallback for the ship gate.
3. If AgentCore/Bedrock access is restored, run the real cloud integration end to end and fix any failures. Capture browser session ID, screenshot, PDF, business checks, and cleanup. Record a browser session and CloudWatch evidence if available.
4. Rerun typecheck, tests, build, smoke, and recording smoke on Linux. Review changes against `review-lessons-mcpjam` and inspect `npm audit` findings before publication.
5. Record the demo using [docs/RECORDING.md](docs/RECORDING.md). Capture coding-agent/AWS connection proof and a repeatable benchmark with N for any headline metric.
6. Update README, architecture, diagram, and submission copy to match the actually deployed path. Publish on AWS Builder Center with one app category and one focus track. Verify the final public URL without judge login.

The handoff should be revised as each gate is actually completed. Keep AWS claims tied to observed output.
