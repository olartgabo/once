# AWS judge demo

The public demo runs Playwright Chromium on AWS App Runner and targets only synthetic Northstar scenarios. Live URL: https://tpuqe8scax.us-east-1.awsapprunner.com. Bedrock and AgentCore remain disabled; their account restrictions are separate from this working hosting path.

`deploy/service-stack.yml` manages stack `once-demo-service-v2`, its single-instance configuration, and ECR pull role. The application has no AWS API role. The image is built locally on Linux and pushed to the existing ECR repository from `once-demo-build`. CodeBuild and the alternative CloudFront deployment remain account-blocked. Failed stack records are retained as evidence.

## Linux release path

This account supports App Runner. AWS has [closed App Runner to new customers](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html); check eligibility before using this template in another account.

With Docker and network access available, the repeatable release script builds and tests a fresh image, pushes it to the existing repository, deploys the template, and runs sample plus UI-recording checks against the public endpoint:

```bash
export PATH="$HOME/.local/bin:$PATH"
AWS_PROFILE=codex-login AWS_REGION=us-east-1 \
  ONCE_BUILD_NETWORK=host bash deploy/linux-release.sh
```

The script defaults to stack `once-demo-service-v2`, uses port 3002 for its temporary local test container, and saves evidence under `artifacts/release`. Set `ONCE_STACK` to a unique name if a previous attempt is `ROLLBACK_COMPLETE`; the script does not delete failed stacks. Confirm the session with STS before a release. It uses a temporary Docker config and pipes the short-lived ECR token directly to Docker.

After the live smoke passes, run a separate public benchmark and record the walkthrough:

```bash
ONCE_API_ORIGIN=<verified-https-url> \
  ONCE_BENCHMARK_OUTPUT=artifacts/public-benchmark.json npm run benchmark
docker run --rm --network host --user "$(id -u):$(id -g)" \
  -e ONCE_API_ORIGIN=<verified-https-url> -v "$PWD:/app" -w /app \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run record:demo
```

Keep local and public measurements distinct. The video recorder uses a fresh browser context, actual UI actions, and captions. Convert the WebM with FFmpeg, inspect the screenshots and PDF, then update [SUBMISSION.md](SUBMISSION.md) and [VERIFICATION.md](VERIFICATION.md) with the observed result.

## EC2 and CloudFront option after account verification

Use AWS profile `codex-login` and region `us-east-1`. The archive contains source, not local run history, artifacts, or credentials.

```powershell
Compress-Archive -Path Dockerfile,package.json,package-lock.json,index.html,tsconfig.json,vite.config.ts,public,src,server,deploy -DestinationPath artifacts/once-source.zip -Force
aws s3 cp artifacts/once-source.zip s3://<source-bucket>/once-source.zip --sse AES256 --profile codex-login --region us-east-1
aws cloudformation validate-template --template-body file://deploy/ec2-demo-stack.yml --profile codex-login --region us-east-1
aws cloudformation deploy --template-file deploy/ec2-demo-stack.yml --stack-name once-demo-web --capabilities CAPABILITY_IAM --parameter-overrides SourceBucket=<source-bucket> VpcId=<vpc-id> SubnetId=<public-subnet-id> CloudFrontPrefixListId=<cloudfront-origin-prefix-list-id> --profile codex-login --region us-east-1
```

If the stack completes, its output `PublicUrl` is the judge URL. CloudFront forwards requests without caching. The instance security group accepts port 3001 only from the AWS-managed CloudFront origin prefix list. No SSH port is open. The instance role can read only the archive and use Systems Manager. Browser run data lives on the instance's encrypted root volume, so replacing the instance resets demo history.

The service runs with `ONCE_PUBLIC_DEMO=1`, `ONCE_HOST=0.0.0.0`, and `ONCE_WEB_ORIGIN=http://127.0.0.1:3001`. Public mode limits writes to 40 POSTs per minute per process and caps stored workflows, scenarios, and runs at 12, 400, and 120. When a cap is reached, the API returns a reset-required response. The demo has no accounts or tenant isolation; use synthetic data only.

## Verify before submission

1. Open `PublicUrl` in a fresh browser session and check `/api/health` reports `browser: local` and `compiler: local-evidence-rules/1.0`.
2. Run the bundled workflow at L0, then compare literal and semantic execution at L4 with the same seed. Confirm the timeline, screenshot, PDF, and six business checks.
3. Repeat from another browser or private window. Check that no sign-in is required and the app remains reachable over HTTPS.
4. Save the public URL, a screenshot of the live run, and the CloudFormation stack outputs in the submission evidence.

The AWS account checks and deployment commands executed by Codex are evidence of a coding agent connection. Capture the Builder Center proof format required by the official hackathon page before publishing the submission.

## EC2 option operations

CloudFormation does not re-run EC2 user data when `once-source.zip` is replaced. Rebuild into a fresh stack for an immutable release, or use Systems Manager to update `/opt/once` and restart the `once` service after testing. Inspect `/var/log/cloud-init-output.log` and `journalctl -u once` through Systems Manager if the health endpoint fails. The template leaves CloudFront pricing at `PriceClass_100`; the EC2 host and CloudFront distribution incur usage charges until the stack is removed.

## App Runner operations

Use a fresh immutable image tag and update CloudFormation to replace the instance. Replacing the instance clears shared demo history and artifacts, so preserve evidence first. Public mode caps writes at 40 POSTs/minute, workflows at 12, scenarios at 400, and runs at 120. A cap requires instance replacement through a new deployment. App Runner and retained ECR images incur charges while provisioned.

Final release image: `demo-20260930-linux-4`, ECR digest `sha256:51eb09f39be0a1075522ba88eb0fc9c1fca4931d45628a0c75eb3e4b22e2c159`. ECR basic scan completed with zero findings. Release evidence is linked from [SUBMISSION.md](SUBMISSION.md).
