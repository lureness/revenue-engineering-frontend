function normalizeBaseUrl(value: string | undefined) {
  const fallback = "http://127.0.0.1:8000/api/v1";
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

export const serverEnv = {
  backendApiBaseUrl: normalizeBaseUrl(
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  ),
} as const;
