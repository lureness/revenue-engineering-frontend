import { publicEnv } from "@/lib/env";

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  accessToken?: string;
  body?: BodyInit | object | null;
  headers?: HeadersInit;
  query?: Record<string, QueryValue>;
};

type ApiErrorPayload = {
  detail?: string;
  [key: string]: unknown;
};

export class ApiClientError extends Error {
  status: number;
  requestId: string | null;
  detail: unknown;

  constructor({
    status,
    message,
    requestId,
    detail,
  }: {
    status: number;
    message: string;
    requestId: string | null;
    detail: unknown;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.requestId = requestId;
    this.detail = detail;
  }
}

function buildApiUrl(path: string, query?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${publicEnv.apiBaseUrl}${normalizedPath}`);

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function resolveBody(body: ApiRequestOptions["body"]) {
  if (body === undefined) {
    return undefined;
  }
  if (body === null) {
    return null;
  }
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    typeof body === "string"
  ) {
    return body;
  }
  return JSON.stringify(body);
}

function buildHeaders(options: ApiRequestOptions) {
  const headers = new Headers(options.headers);
  const body = options.body;

  if (options.accessToken) {
    headers.set("Authorization", `Bearer ${options.accessToken}`);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    body &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    typeof body !== "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as unknown;
  }

  if (contentType.startsWith("text/")) {
    return await response.text();
  }

  return null;
}

function extractErrorMessage(payload: unknown, fallbackStatus: number) {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as ApiErrorPayload).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return `A requisição falhou com status ${fallbackStatus}.`;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
) {
  const response = await fetch(buildApiUrl(path, options.query), {
    ...options,
    body: resolveBody(options.body),
    headers: buildHeaders(options),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiClientError({
      status: response.status,
      message: extractErrorMessage(payload, response.status),
      requestId: response.headers.get("X-Request-ID"),
      detail: payload,
    });
  }

  return payload as TResponse;
}
