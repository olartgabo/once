import { describe, expect, it } from "vitest";
import { isAllowedBridgeRequest } from "../server/browser-agentcore.js";

describe("AgentCore fixture isolation", () => {
  const scenario = "test-scenario";
  const allowed = (path: string, method = "GET") =>
    isAllowedBridgeRequest(
      new URL(path, "https://northstar.once.test"),
      method,
      scenario,
    );
  it("permits only the selected scenario and built UI assets", () => {
    expect(allowed("/northstar?scenario=test-scenario")).toBe(true);
    expect(allowed("/assets/index-abc.js")).toBe(true);
    expect(allowed("/api/scenarios/test-scenario/invoices", "POST")).toBe(true);
    expect(allowed("/api/scenarios/test-scenario")).toBe(true);
  });
  it("denies other scenarios, evaluator/control APIs and external destinations", () => {
    for (const path of [
      "/api/runs",
      "/api/workflows",
      "/api/scenarios/other",
      "/northstar?scenario=other",
      "https://example.com/assets/index.js",
      "/api/scenarios/test-scenario?oracle=1",
    ])
      expect(allowed(path)).toBe(false);
    expect(allowed("/api/scenarios/test-scenario", "DELETE")).toBe(false);
  });
});
