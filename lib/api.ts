export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    method,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}
