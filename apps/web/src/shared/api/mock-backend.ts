import { getApiBaseUrl } from "@/shared/config/server-env";

type BackendFetchOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

export async function backendFetch(path: string, options: BackendFetchOptions = {}) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.error === "string" ? payload.error : `Backend request failed: ${response.status}`;
    return Response.json({ error: message }, { status: response.status });
  }

  return Response.json(payload);
}
