# Once submission voiceover

Read only the script paragraphs below. Aim for a relaxed, conversational pace: about 2 minutes 30 seconds, including pauses. Leave two seconds between paragraphs and five seconds at the beginning and end. Record one continuous take; if you stumble, pause and repeat that sentence. Upload the MP3 in the conversation, or save it as `artifacts/voiceover/once-voiceover.mp3` and share the path. No background music or effects in the recording.

## Script

A browser workflow can work perfectly today and break tomorrow. A button gets renamed, an element ID changes, and the same recorded clicks suddenly stop working.

This is Once: show it once, run through change. It lets you record a task, inspect the workflow, and compare how two automation methods handle a changed interface.

Here, I’m recording an invoice in Northstar, our synthetic customer workspace. I choose Globex Research, add two line items, and set payment terms to Net fifteen. The total is seventeen hundred dollars. Then I create the invoice and export its PDF.

Once turns those recorded events into an inspectable workflow. It preserves the demonstrated values and action order, along with the original events behind each step. You can see exactly what was captured and what will run.

Now we put that workflow through the mutation lab. At level four, the interface has a different theme, changed element IDs, rearranged navigation, and supported label substitutions.

Both methods get a fresh scenario. Selector replay follows the original selectors. Semantic binding looks for visible controls using accessible roles and predefined equivalent labels.

In this run, selector replay fails, while semantic binding completes the invoice. The verifier checks six outcomes: exactly one invoice, the correct customer, line items, payment terms, total, and PDF evidence. Screenshots and the downloaded PDF make the result inspectable.

We also ran thirty executions against the public AWS demo. Semantic binding passed fifteen out of fifteen. Selector replay passed six out of fifteen. These results cover this controlled invoice fixture and its supported changes.

The app runs on AWS App Runner, with its container stored in Amazon ECR and infrastructure managed through CloudFormation. The demo uses Playwright Chromium and a deterministic compiler. Bedrock and AgentCore are optional integrations that remain unverified.

Once makes browser automation easier to inspect, compare, and verify. Show it once. Run through change.

## Planned edit after receiving audio

Use Remotion for a short branded introduction, restrained text animations, scene transitions, the benchmark result card, and the AWS architecture outro. Retain actual public-demo footage for recording, comparison, and verification. Align footage to the narration; remove the old caption overlays by recording clean footage as needed. Add synchronized captions and keep the final video within the submission's 2–3 minute target.
