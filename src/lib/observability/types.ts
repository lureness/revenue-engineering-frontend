export type ObservabilityDashboardSummary = {
  total_requests: number;
  error_requests: number;
  client_error_requests: number;
  server_error_requests: number;
  success_requests: number;
  error_rate: number;
  average_duration_ms: number;
  active_routes: number;
};

export type ObservabilityDashboardTimeseriesItem = {
  bucket_start: string;
  total_requests: number;
  error_requests: number;
  average_duration_ms: number;
};

export type ObservabilityDashboardStatusItem = {
  status_code: number;
  total_requests: number;
  error_requests: number;
};

export type ObservabilityDashboardRouteItem = {
  route_path: string;
  total_requests: number;
  error_requests: number;
  average_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
};

export type ApiRequestLogItem = {
  id: string;
  request_id: string;
  tenant_id: string | null;
  user_id: string | null;
  session_id: string | null;
  method: string;
  path: string;
  route_path: string;
  status_code: number;
  duration_ms: number;
  client_ip: string | null;
  user_agent: string | null;
  query_params: Record<string, unknown> | null;
  path_params: Record<string, unknown> | null;
  error_detail: string | null;
  created_at: string;
};

export type ObservabilityDashboardItem = {
  window_start: string;
  window_end: string;
  summary: ObservabilityDashboardSummary;
  timeseries: ObservabilityDashboardTimeseriesItem[];
  status_breakdown: ObservabilityDashboardStatusItem[];
  top_routes: ObservabilityDashboardRouteItem[];
  recent_errors: ApiRequestLogItem[];
};

export type ObservabilityDashboardViewDefinitionItem = {
  code: string;
  name: string;
  description: string;
  route_prefixes: string[];
};

export type ObservabilityDashboardInsightMetricItem = {
  key: string;
  label: string;
  value: number | string;
  description: string | null;
};

export type ObservabilityDashboardInsightGroupItem = {
  code: string;
  name: string;
  metrics: ObservabilityDashboardInsightMetricItem[];
};

export type ObservabilityDashboardViewItem = ObservabilityDashboardItem & {
  view: ObservabilityDashboardViewDefinitionItem;
  insights: ObservabilityDashboardInsightGroupItem[];
};

export type ObservabilityDrilldownDefinitionItem = {
  code: string;
  domain: string;
  name: string;
  description: string;
  entity_type: string;
  path_template: string;
};

export type ObservabilityDrilldownEntityItem = {
  id: string;
  type: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
};

export type ObservabilityDrilldownItem = {
  window_start: string;
  window_end: string;
  entity: ObservabilityDrilldownEntityItem;
  request_summary: ObservabilityDashboardSummary;
  sections: ObservabilityDashboardInsightGroupItem[];
  recent_errors: ApiRequestLogItem[];
};
