import assert from "node:assert/strict";
import type { Run } from "../src/types.js";

export const apiOrigin = (
  process.env.ONCE_API_ORIGIN || "http://localhost:3001"
).replace(/\/$/, "");

export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiOrigin}/api${path}`, {
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
    signal: AbortSignal.timeout(15_000),
  });
  assert.ok(
    response.ok,
    `${response.status}: ${await response.clone().text()}`,
  );
  return response.json() as Promise<T>;
}

export async function waitForRun(run: Run): Promise<Run> {
  const deadline = Date.now() + 350_000;
  while (run.status === "queued" || run.status === "running") {
    assert.ok(Date.now() < deadline, `Run ${run.id} timed out`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    run = await request<Run>(`/runs/${run.id}`);
  }
  return run;
}

export async function verifyArtifacts(run: Run): Promise<void> {
  assert.ok(run.screenshot, "Screenshot artifact must exist");
  const screenshots = new Set([
    run.screenshot,
    ...run.events.flatMap((event) =>
      event.screenshot ? [event.screenshot] : [],
    ),
  ]);
  for (const url of screenshots) {
    const response = await fetch(new URL(url, apiOrigin), {
      signal: AbortSignal.timeout(15_000),
    });
    assert.ok(response.ok, `Screenshot unavailable: ${url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 1000, `Screenshot too small: ${url}`);
    assert.equal(
      bytes.subarray(0, 8).toString("hex"),
      "89504e470d0a1a0a",
      "PNG signature",
    );
  }
  if (run.status === "passed") {
    assert.ok(run.pdfUrl, "PDF artifact must exist");
    const response = await fetch(new URL(run.pdfUrl, apiOrigin), {
      signal: AbortSignal.timeout(15_000),
    });
    assert.ok(response.ok, "PDF must download");
    assert.match(
      response.headers.get("content-type") || "",
      /application\/pdf/,
    );
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.ok(bytes.length > 800, "PDF minimum size");
    assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", "PDF signature");
  }
}
