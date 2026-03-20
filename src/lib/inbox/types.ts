import type { MessageChannel, MessageDirection } from "@/lib/messaging/types";

export type ConversationStatus = "open" | "closed" | string;

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
  last_message_id: string | null;
  last_message_at: string | null;
  last_inbound_message_at: string | null;
  last_outbound_message_at: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone_number: string | null;
  last_message_direction: MessageDirection | null;
  last_message_preview: string | null;
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
  messages: InboxMessageItem[];
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
  body_text: string;
  subject?: string | null;
};

export type ConversationActionResponse = {
  id: string;
  status: ConversationStatus;
  unread_count: number;
  assigned_user_id: string | null;
  assigned_team_id: string | null;
  closed_at: string | null;
  updated_at: string;
};
