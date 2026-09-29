export const publicDemoLimits = {
  workflows: 12,
  scenarios: 400,
  runs: 120,
  postsPerMinute: 40,
} as const;

export function createPostLimiter(now = Date.now) {
  let windowStart = now();
  let count = 0;
  return () => {
    const current = now();
    if (current - windowStart >= 60_000) {
      windowStart = current;
      count = 0;
    }
    if (count >= publicDemoLimits.postsPerMinute) return false;
    count += 1;
    return true;
  };
}

export function publicDemoFull(
  resource: "workflows" | "scenarios" | "runs",
  count: number,
) {
  return count >= publicDemoLimits[resource];
}
