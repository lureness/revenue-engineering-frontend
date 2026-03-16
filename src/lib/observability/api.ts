import { apiRequest } from "@/lib/api/client";
import type {
  ObservabilityDashboardViewDefinitionItem,
  ObservabilityDashboardViewItem,
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
