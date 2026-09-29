import {
  BedrockAgentCoreClient,
  StartBrowserSessionCommand,
  StopBrowserSessionCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { chromium, type Browser, type BrowserContext } from "playwright";

export const NORTHSTAR_BRIDGE_ORIGIN = "https://northstar.once.test";
const browserIdentifier = "aws.browser.v1";

export function isAllowedBridgeRequest(
  url: URL,
  method: string,
  scenarioId: string,
): boolean {
  if (url.origin !== NORTHSTAR_BRIDGE_ORIGIN || url.username || url.password)
    return false;
  if (method === "GET" && url.pathname === "/northstar")
    return (
      url.searchParams.get("scenario") === scenarioId &&
      [...url.searchParams.keys()].every((key) => key === "scenario")
    );
  if (url.search) return false;
  if (
    method === "GET" &&
    (url.pathname === "/favicon.svg" ||
      /^\/assets\/[A-Za-z0-9_-]+\.(js|css|svg|png|woff2?)$/.test(url.pathname))
  )
    return true;
  const scenarioPath = `/api/scenarios/${scenarioId}`;
  if (method === "GET" && url.pathname === scenarioPath) return true;
  if (method === "POST" && url.pathname === `${scenarioPath}/invoices`)
    return true;
  return (
    method === "GET" &&
    url.pathname.startsWith(`${scenarioPath}/invoices/`) &&
    /^[0-9a-f-]{36}\/pdf$/.test(
      url.pathname.slice(`${scenarioPath}/invoices/`.length),
    )
  );
}

export async function bridgeNorthstar(
  context: BrowserContext,
  scenarioId: string,
): Promise<{ downloadedPdf: () => Buffer | undefined }> {
  let pdfBytes: Buffer | undefined;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!isAllowedBridgeRequest(url, request.method(), scenarioId)) {
      await route.abort("blockedbyclient");
      return;
    }
    try {
      const response = await fetch(
        `http://127.0.0.1:${process.env.PORT || "3001"}${url.pathname}${url.search}`,
        {
          method: request.method(),
          ...(request.method() === "POST"
            ? {
                body: request.postData() ?? "",
                headers: { "Content-Type": "application/json" },
              }
            : {}),
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        },
      );
      const body = Buffer.from(await response.arrayBuffer());
      const headers: Record<string, string> = {
        "Content-Type":
          response.headers.get("content-type") || "application/octet-stream",
      };
      const disposition = response.headers.get("content-disposition");
      if (disposition) headers["Content-Disposition"] = disposition;
      if (
        response.ok &&
        url.pathname.endsWith("/pdf") &&
        headers["Content-Type"].includes("application/pdf")
      )
        pdfBytes = body;
      await route.fulfill({ status: response.status, headers, body });
    } catch (error) {
      process.stderr.write(
        `${JSON.stringify({ event: "bridge.error", path: url.pathname, message: error instanceof Error ? error.message : String(error) })}\n`,
      );
      await route.abort("failed");
    }
  });
  return { downloadedPdf: () => pdfBytes };
}

export type AgentCoreSession = {
  browser: Browser;
  context: BrowserContext;
  sessionId: string;
  stop: () => Promise<void>;
};
export async function startAgentCoreBrowser(
  runId: string,
): Promise<AgentCoreSession> {
  const region = process.env.AWS_REGION || "us-east-1";
  const credentials = fromNodeProviderChain();
  const client = new BedrockAgentCoreClient({
    region,
    credentials,
    maxAttempts: 2,
  });
  let sessionId: string | undefined;
  let browser: Browser | undefined;
  let stopping: Promise<void> | undefined;
  const stop = () => {
    stopping ??= (async () => {
      try {
        if (browser)
          await browser
            .close()
            .catch((error) =>
              process.stderr.write(
                `${JSON.stringify({ event: "agentcore.disconnect.error", sessionId, message: error instanceof Error ? error.name : "Unknown error" })}\n`,
              ),
            );
        if (sessionId)
          await client.send(
            new StopBrowserSessionCommand({ browserIdentifier, sessionId }),
            { abortSignal: AbortSignal.timeout(20000) },
          );
      } finally {
        client.destroy();
      }
    })();
    return stopping;
  };
  try {
    const started = await client.send(
      new StartBrowserSessionCommand({
        browserIdentifier,
        name: `once-${runId}`,
        clientToken: runId,
        sessionTimeoutSeconds: 300,
        viewPort: { width: 1440, height: 1000 },
      }),
      { abortSignal: AbortSignal.timeout(45000) },
    );
    sessionId = started.sessionId;
    if (!sessionId)
      throw new Error("AgentCore did not return a browser session ID.");
    const hostname = `bedrock-agentcore.${region}.amazonaws.com`;
    const streamPath = `/browser-streams/${browserIdentifier}/sessions/${sessionId}/automation`;
    const signer = new SignatureV4({
      service: "bedrock-agentcore",
      region,
      credentials,
      sha256: Sha256,
    });
    const signed = await signer.sign(
      new HttpRequest({
        protocol: "wss:",
        hostname,
        path: streamPath,
        method: "GET",
        headers: { host: hostname },
      }),
    );
    try {
      browser = await chromium.connectOverCDP(
        `wss://${hostname}${streamPath}`,
        { headers: signed.headers, timeout: 30000 },
      );
    } catch {
      throw new Error(
        `Could not connect to AgentCore browser session ${sessionId}. Check AWS browser permissions and network access.`,
      );
    }
    const context = browser.contexts()[0];
    if (!context)
      throw new Error(
        `AgentCore browser session ${sessionId} has no browser context.`,
      );
    return { browser, context, sessionId, stop };
  } catch (error) {
    try {
      await stop();
    } catch (cleanupError) {
      process.stderr.write(
        `${JSON.stringify({ event: "agentcore.stop.error", sessionId, message: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) })}\n`,
      );
    }
    throw error;
  }
}
