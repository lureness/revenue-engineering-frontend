import type {
  ObservabilityDashboardStatusItem,
  ObservabilityDashboardTimeseriesItem,
} from "@/lib/observability/types";

export function formatRequestCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function formatDuration(value: number) {
  if (value < 1000) {
    return `${Math.round(value)} ms`;
  }

  return `${(value / 1000).toFixed(2).replace(".", ",")} s`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatCompactTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getTimeseriesPeak(
  items: ObservabilityDashboardTimeseriesItem[],
) {
  return items.reduce((peak, item) => Math.max(peak, item.total_requests), 0);
}

export function getTimeseriesBarHeight(
  item: ObservabilityDashboardTimeseriesItem,
  peak: number,
) {
  if (peak <= 0) {
    return 8;
  }

  return Math.max(8, Math.round((item.total_requests / peak) * 100));
}

export function getTimeseriesErrorHeight(
  item: ObservabilityDashboardTimeseriesItem,
  peak: number,
) {
  if (peak <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((item.error_requests / peak) * 100));
}

export function getStatusTone(item: ObservabilityDashboardStatusItem) {
  if (item.status_code >= 500) {
    return "destructive" as const;
  }

  if (item.status_code >= 400) {
    return "warning" as const;
  }

  return "success" as const;
}
