# AWS demo access checks — September 29, 2026

Profile: `codex-login`. Account: `733366527874`. Region: `us-east-1`.
Authentication was renewed successfully. No AgentCore session was created.

## Observed failures

- Bedrock `get-foundation-model-availability` for `amazon.nova-lite-v1:0` returns agreement AVAILABLE, entitlement AVAILABLE, region AVAILABLE, authorization NOT_AUTHORIZED.
- Converse for `us.amazon.nova-lite-v1:0` returns `ValidationException: Operation not allowed`.
- AgentCore StartBrowserSession for `aws.browser.v1` returns `maxBrowserSessions limit exceeded for account 733366527874. Please contact AWS Support for more information.`
- ListBrowserSessions returns no sessions.
- Applied Service Quota `L-1CB82154` is 0 concurrent active browser sessions.
- Requesting a quota of 1 was rejected: `You must provide a quota value greater than the default quota value of 1000.0`. No quota increase request was accepted. Raising it above 1000 is unnecessary for this one-session demo.
- CodeBuild `StartBuild` for the private image build returned `AccountLimitExceededException: Cannot have more than 0 builds in queue for the account`. The CodeBuild project was created but no build ran.
- CloudFront distribution creation returned HTTP 403: `Your account must be verified before you can add new CloudFront resources. To verify your account, please contact AWS Support ... and include this error message.` The EC2 and CloudFront stack rolled back; no public URL was produced.

The existing `once-demo-build` CloudFormation stack contains a private source bucket, an empty ECR repository, and a CodeBuild project. The failed `once-demo-web` stack reached `ROLLBACK_COMPLETE`; every resource is `DELETE_COMPLETE`, including the EC2 host. Its failed stack record remains for error evidence. Inspect `once-demo-build` before any cleanup; its private source bucket is retained by policy.

## What to investigate in the AWS account

The account owner is researching these restrictions and will handle AWS Support. Ask AWS to verify or explain the account-level restrictions on (1) CloudFront resource creation, (2) CodeBuild builds with an applied queue limit of zero, (3) Nova Lite authorization despite the three availability checks passing, and (4) AgentCore Browser applied concurrency of zero. Include the exact errors above, account ID `733366527874`, and Region `us-east-1`. Request only the access needed for one synthetic demo, not a quota of 1001 browser sessions.

The AWS Support case below remains a draft. Codex has not submitted it.

## Draft for AWS Support

Please investigate account verification and service eligibility in us-east-1 for account 733366527874. CloudFront distribution creation returns HTTP 403 saying the account must be verified before adding new CloudFront resources. CodeBuild StartBuild returns AccountLimitExceededException because the account may have zero builds in queue. Amazon Nova Lite reports NOT_AUTHORIZED despite agreement, entitlement, and region availability being AVAILABLE; Converse returns ValidationException: Operation not allowed. AgentCore Browser has an applied concurrency quota of zero with no sessions, and StartBrowserSession is rejected. A request to enable one session is rejected because Service Quotas compares it against a default of 1000. Please explain the account verification or activation steps needed. This is a low-volume synthetic invoice workflow demo requiring one browser session and low-volume inference.

This text has not been submitted to AWS Support. Use the AWS Support console for account/service activation help.

## Verified local demo

17 unit tests passed. Typecheck and production build passed. Live local smoke tests: semantic L0/L2/L4 passed 6/6 business checks; literal L0 passed 6/6; literal L2/L4 failed as expected after selectors changed. These results do not prove cloud execution.
