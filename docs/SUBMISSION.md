# Builder Center submission

Prepared project copy and evidence for the owner to publish on AWS Builder Center.

## Project fields

- Title: **Once - show it once, run through change**
- App category: **Workplace Efficiency**
- Focus track: **Community** (open-source developer experiment and verification tool)
- Source: `https://github.com/olartgabo/once/tree/codex/once`
- Verified live URL: `https://tpuqe8scax.us-east-1.awsapprunner.com`
- Demo video: [captioned live AWS walkthrough](https://github.com/olartgabo/once/releases/download/submission-20260930/once-walkthrough.mp4).

## Project description

A recorded browser click sequence can break when an interface changes. Once lets builders demonstrate an invoice task, inspect exactly what was recorded, and compare selector replay with visible-role binding on controlled interface mutations.

The included Northstar CRM uses fictional customers and real invoice PDFs. Record a demonstration, compile it into a versioned workflow with event provenance, then change theme, element IDs, layout, and supported visible labels. Each method gets a fresh scenario. The independent verifier checks the saved invoice's customer, line items, payment terms, total, exactly-one-invoice condition, and downloaded PDF evidence. Timelines, intermediate screenshots, final screenshots, and PDFs make outcomes inspectable.

The product is a small, open-source workflow laboratory for developers and teams evaluating browser automation. It demonstrates why task completion should be measured by business outcomes rather than a browser reaching an apparent success screen.

## Development and coding-agent use

Codex worked with the owner to implement demonstration recording, the deterministic compiler, browser execution, comparison experiments, evidence capture, and bounded public-demo behavior. During Linux submission preparation, Codex ran typecheck, 17 unit tests, production builds, sample and custom-recording smoke checks, and a 30-execution fixture benchmark. It upgraded the affected Vitest development dependency, removed development packages from the runtime image, and corrected AWS template errors discovered during validation and provisioning.

The owner completed a fresh browser-based `aws login` on Linux. Codex verified the authenticated account with STS, inspected the existing CloudFormation outputs, pushed the locally built image to the private ECR repository, and validated and applied the public-service CloudFormation template. Connection and deployment evidence is saved without credential values. See [coding-agent connection proof](CODING-AGENT-PROOF.md) and the downloadable raw evidence.

## AWS services and actual scope

The deployment path uses Amazon ECR for the container image, AWS CloudFormation for infrastructure, and AWS App Runner for the public HTTPS application. App Runner runs Express, the React app, synthetic Northstar fixture, and Playwright Chromium in one bounded instance. State and artifacts live on the instance filesystem and reset when it is replaced.

The public executor uses accessible roles and a predefined vocabulary of equivalent labels. It follows the recorded action order and values. It does not train a model, learn a general policy, or automate arbitrary websites. Optional Bedrock and AgentCore adapters are implemented and tested at their local validation boundaries; their live integration remains unverified and is disabled for this release.

## Measured results

Independent local-container and public AWS benchmarks each used three seeds across five fixed cumulative levels and two methods, N=30 per environment. Semantic binding passed 15/15. Selector replay passed 6/15, succeeding at L0 and L1 and failing when IDs changed at L2-L4. Every successful run passed six business checks, and artifacts were downloaded and checked. Seeds vary IDs only; theme, layout, and label mutations are fixed. These results describe this supported synthetic fixture, not arbitrary browser-agent reliability. See [VERIFICATION.md](VERIFICATION.md).

## Publication fields

- Attach the [submission evidence archive](https://github.com/olartgabo/once/releases/download/submission-20260930/once-evidence.zip) and [coding-agent connection proof](CODING-AGENT-PROOF.md).
- Link the verified public URL, source branch, and live walkthrough above.
- Use Workplace Efficiency as the single app category and Community as the focus track.
- Publish the project on Builder Center before the official deadline, October 2, 2026, 11:59 PM PDT. The owner must complete any account-support work; no support case has been filed by Codex.

Official rules: [AWS Zero to Shipped](https://builder.aws.com/build/hackathons/e83e84e5-4f4c-383b-bbe9-4a15ac195d55/zero-to-shipped?tab=rules), checked in a browser during this preparation. A live public AWS application and documented coding-agent connection are mandatory ship gates.

Release downloads: [source archive](https://github.com/olartgabo/once/releases/download/submission-20260930/once-source.zip), [evidence archive](https://github.com/olartgabo/once/releases/download/submission-20260930/once-evidence.zip), [video](https://github.com/olartgabo/once/releases/download/submission-20260930/once-walkthrough.mp4). Builder Center publication itself has not been performed.
