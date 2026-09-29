# AWS judge demo

The planned public demo runs the proven local Playwright executor on AWS and targets only synthetic Northstar scenarios. Amazon Bedrock and AgentCore Browser remain disabled until the account access issues in [AWS-ACCESS-BLOCKERS.md](AWS-ACCESS-BLOCKERS.md) are resolved and a cloud run is verified. No public deployment has passed its live check yet.

`deploy/ec2-demo-stack.yml` defines an EC2 and CloudFront option, but CloudFront creation is blocked by an account-verification error. The private source archive bucket is in `deploy/build-stack.yml`. That stack also defines CodeBuild and ECR resources; CodeBuild currently rejects builds because its queue limit is zero. `deploy/service-stack.yml` defines an App Runner option that can use an image built on a developer's Docker host. See [LINUX-HANDOFF.md](../LINUX-HANDOFF.md) for that path.

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

## Operations

CloudFormation does not re-run EC2 user data when `once-source.zip` is replaced. Rebuild into a fresh stack for an immutable release, or use Systems Manager to update `/opt/once` and restart the `once` service after testing. Inspect `/var/log/cloud-init-output.log` and `journalctl -u once` through Systems Manager if the health endpoint fails. The template leaves CloudFront pricing at `PriceClass_100`; the EC2 host and CloudFront distribution incur usage charges until the stack is removed.
