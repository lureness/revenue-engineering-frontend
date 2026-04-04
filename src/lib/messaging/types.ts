export type ProviderName = string;
export type ProviderMode = "managed" | "byo";
export type ProviderStatus = "draft" | "active" | "inactive" | "error";

export type ProviderAccountItem = {
  id: string;
  tenant_id: string;
  created_by_user_id: string | null;
  provider: ProviderName | string;
  mode: ProviderMode | string;
  status: ProviderStatus | string;
  account_sid: string;
  api_key_sid: string | null;
  secret_ref: string | null;
  configuration: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type WhatsAppSenderStatus =
  | "draft"
  | "pending_verification"
  | "active"
  | "inactive"
  | "error";

export type WhatsAppSenderItem = {
  id: string;
  tenant_id: string;
  provider_account_id: string;
  created_by_user_id: string | null;
  sender_sid: string | null;
  sender_id: string | null;
  phone_number: string;
  messaging_service_sid: string | null;
  waba_id: string | null;
  display_name: string | null;
  status: WhatsAppSenderStatus | string;
  is_default: boolean;
  configuration: Record<string, unknown> | null;
  verified_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageChannel = "email" | "sms" | "whatsapp" | string;
export type MessageDirection = "inbound" | "outbound" | string;

export type MessageItem = {
  id: string;
  tenant_id: string | null;
  created_by_user_id: string | null;
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

export type CreateWhatsAppSenderPayload = {
  provider_account_id: string;
  phone_number: string;
  sender_sid?: string;
  sender_id?: string;
  messaging_service_sid?: string;
  waba_id?: string;
  display_name?: string;
  is_default?: boolean;
};

export type CreateProviderAccountPayload = {
  provider?: ProviderName;
  mode?: ProviderMode;
  status?: ProviderStatus;
  account_sid: string;
  api_key_sid?: string;
  secret_ref?: string;
  configuration?: Record<string, unknown>;
};

export type MessagingProviderFieldItem = {
  key: string;
  label: string;
  required: boolean;
  secret: boolean;
  placeholder: string | null;
  description: string | null;
};

export type MessagingProviderItem = {
  code: string;
  label: string;
  status: string;
  supported_channels: string[];
  provider_account_fields: MessagingProviderFieldItem[];
  whatsapp_sender_fields: MessagingProviderFieldItem[];
  notes: string | null;
};

export type MessageFilters = {
  channel?: string;
  direction?: string;
  status?: string;
};
