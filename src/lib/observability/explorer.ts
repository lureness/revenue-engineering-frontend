import type {
  ApiRequestLogsQuery,
  ApiRequestMetricsQuery,
} from "@/lib/observability/types";

export type ObservabilityLogFilters = {
  method: string;
  statusCode: string;
  routePath: string;
  requestId: string;
  limit: string;
};

export type ObservabilityMetricFilters = {
  method: string;
  statusCode: string;
  routePath: string;
  limit: string;
};

function toOptionalTrimmedString(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function toOptionalInteger(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampLimit(value: number | undefined, min: number, max: number) {
  if (!value) {
    return undefined;
  }

  return Math.min(max, Math.max(min, value));
}

export function buildApiRequestLogsQuery(filters: ObservabilityLogFilters) {
  const limit = clampLimit(toOptionalInteger(filters.limit), 1, 200) ?? 30;

  return {
    method: toOptionalTrimmedString(filters.method)?.toUpperCase(),
    status_code: toOptionalInteger(filters.statusCode),
    route_path: toOptionalTrimmedString(filters.routePath),
    request_id: toOptionalTrimmedString(filters.requestId),
    limit,
  } satisfies ApiRequestLogsQuery;
}

export function buildApiRequestMetricsQuery(
  filters: ObservabilityMetricFilters,
  hours: number,
  now = new Date(),
) {
  const endAt = now.toISOString();
  const startAt = new Date(
    now.getTime() - hours * 60 * 60 * 1000,
  ).toISOString();
  const limit = clampLimit(toOptionalInteger(filters.limit), 1, 500) ?? 120;

  return {
    method: toOptionalTrimmedString(filters.method)?.toUpperCase(),
    status_code: toOptionalInteger(filters.statusCode),
    route_path: toOptionalTrimmedString(filters.routePath),
    start_at: startAt,
    end_at: endAt,
    limit,
  } satisfies ApiRequestMetricsQuery;
}
