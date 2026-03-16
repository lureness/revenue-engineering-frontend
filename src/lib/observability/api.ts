import { apiRequest } from "@/lib/api/client";
import type {
  ApiRequestLogItem,
  ApiRequestLogsQuery,
  ApiRequestMetricItem,
  ApiRequestMetricsQuery,
  ObservabilityDashboardViewDefinitionItem,
  ObservabilityDashboardViewItem,
  ObservabilityDrilldownDefinitionItem,
  ObservabilityDrilldownItem,
} from "@/lib/observability/types";

type DashboardQuery = {
  hours?: number;
  top_routes_limit?: number;
  recent_errors_limit?: number;
};

export async function getObservabilityDashboardViews() {
  return apiRequest<ObservabilityDashboardViewDefinitionItem[]>(
    "/observability/dashboard/views",
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function getObservabilityDashboardView(
  viewCode: string,
  query: DashboardQuery = {},
) {
  return apiRequest<ObservabilityDashboardViewItem>(
    `/observability/dashboard/views/${viewCode}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getObservabilityDrilldowns() {
  return apiRequest<ObservabilityDrilldownDefinitionItem[]>(
    "/observability/drilldowns",
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function getAuthUserDrilldown(
  userId: string,
  query: Pick<DashboardQuery, "hours"> = {},
) {
  return apiRequest<ObservabilityDrilldownItem>(
    `/observability/drilldowns/auth/users/${userId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getAccessUserDrilldown(
  userId: string,
  query: Pick<DashboardQuery, "hours"> = {},
) {
  return apiRequest<ObservabilityDrilldownItem>(
    `/observability/drilldowns/access/users/${userId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getMessagingSenderDrilldown(
  whatsappSenderId: string,
  query: Pick<DashboardQuery, "hours"> = {},
) {
  return apiRequest<ObservabilityDrilldownItem>(
    `/observability/drilldowns/messaging/senders/${whatsappSenderId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getMessagingProviderAccountDrilldown(
  providerAccountId: string,
  query: Pick<DashboardQuery, "hours"> = {},
) {
  return apiRequest<ObservabilityDrilldownItem>(
    `/observability/drilldowns/messaging/provider-accounts/${providerAccountId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getTeamDrilldown(
  teamId: string,
  query: Pick<DashboardQuery, "hours"> = {},
) {
  return apiRequest<ObservabilityDrilldownItem>(
    `/observability/drilldowns/teams/${teamId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function getApiRequestLogs(query: ApiRequestLogsQuery = {}) {
  return apiRequest<ApiRequestLogItem[]>("/observability/logs", {
    method: "GET",
    query,
    cache: "no-store",
  });
}

export async function getApiRequestMetrics(query: ApiRequestMetricsQuery = {}) {
  return apiRequest<ApiRequestMetricItem[]>("/observability/metrics", {
    method: "GET",
    query,
    cache: "no-store",
  });
}
