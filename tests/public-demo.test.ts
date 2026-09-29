import { describe, expect, it } from "vitest";
import {
  createPostLimiter,
  publicDemoFull,
  publicDemoLimits,
} from "../server/public-demo.js";

describe("public demo boundaries", () => {
  it("limits POSTs per minute and reopens the next window", () => {
    let time = 0;
    const allowPost = createPostLimiter(() => time);
    for (let i = 0; i < publicDemoLimits.postsPerMinute; i++)
      expect(allowPost()).toBe(true);
    expect(allowPost()).toBe(false);
    time = 60_000;
    expect(allowPost()).toBe(true);
  });

  it("stops new records exactly at each lifetime capacity", () => {
    for (const resource of ["workflows", "scenarios", "runs"] as const) {
      expect(publicDemoFull(resource, publicDemoLimits[resource] - 1)).toBe(
        false,
      );
      expect(publicDemoFull(resource, publicDemoLimits[resource])).toBe(true);
    }
  });
});
