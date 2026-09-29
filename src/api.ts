export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    signal: AbortSignal.timeout(
      path === "/workflows" && body !== undefined ? 45000 : 15000,
    ),
    method: body === undefined ? "GET" : "POST",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const data = (await response
      .json()
      .catch(() => ({ error: `Request failed (${response.status})` }))) as {
      error?: string;
    };
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}
