import type {
  MessageDirection,
  ProviderAccountItem,
  ProviderStatus,
  WhatsAppSenderItem,
  WhatsAppSenderStatus,
} from "@/lib/messaging/types";

export function getProviderAccountDisplayName(account: ProviderAccountItem) {
  const friendlyName = account.configuration?.friendly_name;

  if (typeof friendlyName === "string" && friendlyName.trim()) {
    return friendlyName;
  }

  return account.account_sid;
}

export function getProviderStatusLabel(status: ProviderStatus | string) {
  switch (status) {
    case "active":
      return "Ativa";
    case "inactive":
      return "Inativa";
    case "error":
      return "Erro";
    default:
      return "Rascunho";
  }
}

export function getSenderStatusLabel(status: WhatsAppSenderStatus | string) {
  switch (status) {
    case "pending_verification":
      return "Aguardando verificação";
    case "active":
      return "Ativo";
    case "inactive":
      return "Inativo";
    case "error":
      return "Erro";
    default:
      return "Rascunho";
  }
}

export function getMessageDirectionLabel(direction: MessageDirection | string) {
  switch (direction) {
    case "inbound":
      return "Entrada";
    case "outbound":
      return "Saída";
    default:
      return direction;
  }
}

export function getMessageChannelLabel(channel: string) {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";
    case "sms":
      return "SMS";
    case "email":
      return "E-mail";
    default:
      return channel;
  }
}

export function getMessageCounterpartyLabel(message: {
  direction: string;
  sender: string | null;
  recipient: string | null;
}) {
  if (message.direction === "inbound") {
    return message.sender ?? "Origem desconhecida";
  }

  return message.recipient ?? "Destino desconhecido";
}

export function getSenderDisplayName(sender: WhatsAppSenderItem) {
  return sender.display_name?.trim() || sender.phone_number;
}
