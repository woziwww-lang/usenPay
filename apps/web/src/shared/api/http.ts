import { ApiClientError, type ApiErrorPayload } from "./errors";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const errorPayload = isErrorPayload(payload) ? payload : null;
    throw new ApiClientError(
      errorPayload?.error ?? errorPayload?.message ?? `Request failed: ${response.status}`,
      response.status,
      errorPayload,
    );
  }

  return payload as T;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiClientError("API returned invalid JSON", response.status);
  }
}

function isErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(value) && typeof value === "object";
}
