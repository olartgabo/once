# Coding-agent AWS connection evidence

The owner completed browser-based AWS CLI `aws login --profile codex-login` on Linux. Codex used that authenticated profile to run STS, inspect CloudFormation, push a tested container to ECR, and create/update App Runner through CloudFormation in account `733366527874`, region `us-east-1`. No credentials are included in the evidence.

STS returned `arn:aws:iam::733366527874:root`. This was the owner's console-authenticated submission-preparation session. The deployed application has no AWS API role; its separate image-pull role grants App Runner access to ECR.

The native CloudTrail event history records `CreateService`, event ID `abc47b67-c8b1-4502-86f9-d0c831a72c70`, at September 29, 2026, 20:16:39 UTC-04. The service is `once-demo-service-v2-once`, ID `743b047f746c4f99900c27da95d85ede`. App Runner creation operation `7e4dfe1effe64589a25d81570a57d3d5` completed successfully. No separate CloudTrail trail was provisioned.

The submission evidence archive includes the STS response, service outputs, actual CloudTrail event-history response, ECR digest/scan, deployment events, public test logs, benchmark results, and walkthrough metadata. These document the coding agent's connection and actual AWS operations; they are not screenshots of an unperformed integration.

Live application: https://tpuqe8scax.us-east-1.awsapprunner.com.

The committed [CloudTrail service-event response](evidence/coding-agent-service-event.json) and [ECR scan response](evidence/ecr-scan.json) are selected raw evidence. Final App Runner update operation `691dc593f1504f399bff53b16c6f7f19` succeeded at September 29, 2026, 23:19:22 UTC-04 using image tag `demo-20260930-linux-4`.
