import type { MessageChannel, MessageDirection } from "@/lib/messaging/types";

export type ConversationStatus = "open" | "closed" | string;
export type ConversationAgentStatus =
  | "inactive"
  | "active"
  | "paused"
  | "handoff"
  | string;

export type InboxConversationListItem = {
  id: string;
  tenant_id: string;
  contact_id: string;
  provider_account_id: string;
  whatsapp_sender_id: string | null;
  channel: MessageChannel;
  status: ConversationStatus;
  sender_key: string;
  subject: string | null;
  unread_count: number;
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  agent_id: string | null;
  agent_status: ConversationAgentStatus;
  last_message_id: string | null;
  last_message_at: string | null;
  last_inbound_message_at: string | null;
  last_outbound_message_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone_number: string | null;
  last_message_direction: MessageDirection | null;
  last_message_preview: string | null;
  survey_submission_id: string | null;
  survey_result_profile_name: string | null;
};

export type InboxConversationListResponse = {
  items: InboxConversationListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type InboxMessageItem = {
  id: string;
  conversation_id: string | null;
  contact_id: string | null;
  provider_account_id: string | null;
  whatsapp_sender_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  provider: string;
  status: string;
  external_message_id: string | null;
  sender: string | null;
  recipient: string | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  template_code: string | null;
  error_detail: string | null;
  payload: Record<string, unknown> | null;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
};

export type InboxConversationDetail = {
  id: string;
  tenant_id: string;
  contact_id: string;
  provider_account_id: string;
  whatsapp_sender_id: string | null;
  channel: MessageChannel;
  status: ConversationStatus;
  sender_key: string;
  subject: string | null;
  unread_count: number;
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  agent_id: string | null;
  agent_status: ConversationAgentStatus;
  agent_name: string | null;
  agent_role_title: string | null;
  agent_paused_at: string | null;
  agent_paused_by_user_id: string | null;
  agent_handoff_at: string | null;
  agent_handoff_user_id: string | null;
  last_message_id: string | null;
  last_message_at: string | null;
  last_inbound_message_at: string | null;
  last_outbound_message_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone_number: string | null;
  survey: InboxConversationSurveyContext | null;
  latest_agent_run: AgentRunSummaryItem | null;
  messages: InboxMessageItem[];
};

export type InboxConversationSurveyContext = {
  submission_id: string;
  template_name: string | null;
  result_profile_code: string | null;
  result_profile_name: string | null;
  total_score: number | null;
  max_score: number | null;
  percentage: number | null;
  respondent_name: string | null;
  company_name: string | null;
  annual_revenue_range: string | null;
  sales_team_size_range: string | null;
  completed_at: string | null;
  unlocked_at: string | null;
};

export type AgentRunSummaryItem = {
  id: string;
  agent_code: string;
  analysis_type: string;
  status: string;
  summary: string | null;
  priority: string | null;
  next_action: string | null;
  suggested_reply: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type AgentRunItem = AgentRunSummaryItem & {
  tenant_id: string;
  conversation_agent_id: string | null;
  conversation_id: string | null;
  survey_submission_id: string | null;
  subject_type: string;
  subject_id: string;
  input_snapshot: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  updated_at: string;
};

export type InboxConversationFilters = {
  status?: string;
  channel?: string;
  assigned_user_id?: string;
  assigned_team_id?: string;
  contact_id?: string;
  has_unread?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
};

export type AssignConversationPayload = {
  assigned_user_id?: string | null;
  assigned_team_id?: string | null;
};

export type SendConversationMessagePayload = {
  body_text?: string | null;
  subject?: string | null;
  standard_message_id?: string | null;
};

export type ConversationActionResponse = {
  id: string;
  status: ConversationStatus;
  unread_count: number;
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  agent_status: ConversationAgentStatus;
  agent_paused_at: string | null;
  agent_handoff_at: string | null;
  closed_at: string | null;
  updated_at: string;
};

export type StandardMessageItem = {
  id: string;
  tenant_id: string;
  created_by_user_id: string | null;
  code: string;
  name: string;
  description: string;
  channel: MessageChannel | null;
  subject_template: string | null;
  body_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateStandardMessagePayload = {
  code: string;
  name: string;
  description?: string;
  channel?: string | null;
  subject_template?: string | null;
  body_template: string;
  is_active?: boolean;
};

export type UpdateStandardMessagePayload = {
  name?: string;
  description?: string;
  channel?: string | null;
  subject_template?: string | null;
  body_template?: string;
  is_active?: boolean;
};
