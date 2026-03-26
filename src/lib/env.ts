function normalizeBaseUrl(value: string | undefined) {
  const fallback = "http://127.0.0.1:8000/api/v1";
  return (value?.trim() || fallback).replace(/\/+$/, "");
}

function normalizeOptionalUrl(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return "";
  }

  return normalized.replace(/\/+$/, "");
}

export const publicEnv = {
  apiBaseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  typebotBuilderUrl: normalizeOptionalUrl(
    process.env.NEXT_PUBLIC_TYPEBOT_BUILDER_URL,
  ),
  diagnosticoTenantSlug:
    process.env.NEXT_PUBLIC_DIAGNOSTICO_TENANT_SLUG?.trim() || "",
  diagnosticoSurveySlug:
    process.env.NEXT_PUBLIC_DIAGNOSTICO_SURVEY_SLUG?.trim() || "",
} as const;
