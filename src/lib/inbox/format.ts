import type {
  ConversationAgentStatus,
  ConversationStatus,
  InboxConversationListItem,
  InboxMessageItem,
} from "@/lib/inbox/types";
import type { MessageChannel, MessageDirection } from "@/lib/messaging/types";

const CHANNEL_LABELS: Record<string, string> = {
  email: "E-mail",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  closed: "Encerrada",
};

const AGENT_STATUS_LABELS: Record<string, string> = {
  inactive: "Inativo",
  active: "Ativo",
  paused: "Pausado",
  handoff: "Atendimento humano",
};

const DIRECTION_LABELS: Record<string, string> = {
  inbound: "Entrada",
  outbound: "Saída",
};

export function getInboxChannelLabel(channel: MessageChannel) {
  return CHANNEL_LABELS[channel] ?? channel;
}

export function getInboxConversationStatusLabel(status: ConversationStatus) {
  return STATUS_LABELS[status] ?? status;
}

export function getInboxConversationAgentStatusLabel(
  status: ConversationAgentStatus,
) {
  return AGENT_STATUS_LABELS[status] ?? status;
}

export function getInboxMessageDirectionLabel(direction: MessageDirection) {
  return DIRECTION_LABELS[direction] ?? direction;
}

export function getInboxMessageTimestamp(message: InboxMessageItem) {
  return message.received_at ?? message.sent_at ?? message.created_at;
}

export function getInboxConversationPreview(
  conversation: InboxConversationListItem,
) {
  return (
    conversation.last_message_preview ??
    conversation.subject ??
    "Sem prévia disponível"
  );
}

export function getInboxConversationDisplayName(
  conversation: Pick<
    InboxConversationListItem,
    "contact_name" | "contact_email" | "contact_phone_number"
  >,
) {
  return (
    conversation.contact_name ??
    conversation.contact_email ??
    conversation.contact_phone_number ??
    "Contato sem identificação"
  );
}
