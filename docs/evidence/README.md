# Selected public release evidence

- [public-benchmark.json](public-benchmark.json): all 30 executions against the public AWS endpoint, including expected baseline failures, runtime settings, timestamps, artifact paths, and business checks.
- [verified-live-run.png](verified-live-run.png): an actual newly recorded Globex workflow completing at L4 with six passing checks on the public application.
- [ecr-scan.json](ecr-scan.json): completed ECR basic scan of the final image with zero findings.
- [coding-agent-service-event.json](coding-agent-service-event.json): native CloudTrail event history for the agent's CloudFormation-driven App Runner creation.

The complete downloadable release includes run metadata, actual PNG/PDF bytes, service status, ECR digest, console-authenticated STS proof, logs, and the captioned walkthrough. Links are in [SUBMISSION.md](../SUBMISSION.md). The synthetic fixture results do not establish general browser reliability or live Bedrock/AgentCore success.
