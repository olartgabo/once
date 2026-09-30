# Decisions

## Keep the control plane local during development

React/Vite, Express, and Playwright make the full recording-to-verification loop runnable without cloud credentials. Optional Bedrock and AgentCore adapters now exist behind environment flags. The local path has completed end-to-end smoke runs; the optional managed-model/browser path has not, because account authorization and browser-session quota blocked live calls. Keeping the control plane on loopback also avoids exposing its unauthenticated run and artifact APIs.

## Use one synthetic task family

Northstar invoice creation provides persisted business state, numeric totals, payment terms, and a downloadable artifact. Three customers and editable line items allow demonstrations with different inputs. The app supports one invoice per isolated scenario and does not claim arbitrary website or task support.

## Compile deterministically

The compiler validates captured evidence and builds a versioned workflow with source event IDs. This makes compilation inspectable and reproducible. Its abstraction is limited: action order is retained, values come from the demonstration, and intent descriptions follow fixed rules. General semantic plan inference and task parameterization require further work.

## Compare two browser methods

Both methods use Playwright and the same compiled steps in fresh scenarios. Literal replay uses selectors. Default semantic binding uses accessible roles and supported label equivalents. The latter survives the included mutations because it can resolve those specific alternatives. When enabled, Bedrock selects an exact role and name from visible candidates; its response is validated before any action. Arbitrary synonym understanding and dynamic recovery are outside the demonstrated local implementation. The Bedrock path remains live-unverified.

## Make mutations cumulative and reproducible

Levels progressively alter theme, IDs, layout, and labels. The seed determines changed IDs; the other transformations are fixed fixtures. This produces a small controlled comparison. Future benchmarking should vary independent mutations, customers, tasks, and seeds and report sample sizes and uncertainty.

## Verify saved outcomes

A browser reaching an apparent success screen is insufficient. The verifier checks the isolated scenario's persisted invoice and downloaded PDF evidence. The total uses integer cents. The current PDF check validates header, size, and export state; parsing its content would strengthen artifact verification.

## Store local evidence

JSON persistence and artifact files keep runs inspectable across restarts. A single active run keeps local resource use bounded. Multi-process writes, user accounts, access control, retention policies, and cloud storage are not implemented.

## Capture default values at submission

A successful demonstration may leave quantity or payment terms unchanged. Capturing final form values before the submit action supplies evidence for those defaults and makes replay explicit. The event stream can therefore contain form-value snapshots as well as direct input changes.

## Add AWS adapters behind explicit flags

Bedrock Converse can enrich existing step intents and select observed controls without changing recorded values or action order. AgentCore Browser can replace the local browser session while a restricted fixture bridge serves the current scenario. Both modes share the verifier. These design choices make the integration testable without claiming a successful cloud run. The current account is blocked from Nova Lite inference and AgentCore Browser sessions; the public release instead hosts the proven Playwright path on AWS App Runner.

## Preserve the original brief as a target

The project name is Once. The implemented local prototype covers the core invoice experiment. Remaining work includes live managed Bedrock/AgentCore execution and verification, richer semantic workflow abstraction and recovery, additional workflows, a larger benchmark, and durable cloud persistence. The release demonstrates AWS hosting; no managed AI completion or general-purpose learning claim is made.

## Host the verified browser path on App Runner

Build Chromium locally on Linux and push the immutable image to ECR. CloudFormation manages one App Runner instance and the ECR pull role. This avoids the account restrictions affecting CodeBuild and CloudFront. Public mode bounds requests and stored records; synthetic state is ephemeral and shared. The working hosted path does not depend on the blocked managed AI services.
