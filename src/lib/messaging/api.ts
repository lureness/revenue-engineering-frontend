import { apiRequest } from "@/lib/api/client";
import type {
  CreateWhatsAppSenderPayload,
  MessageFilters,
  MessageItem,
  ProviderAccountItem,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";

export async function getProviderAccounts() {
  return apiRequest<ProviderAccountItem[]>("/provider-accounts", {
    method: "GET",
    cache: "no-store",
  });
}

export async function getWhatsAppSenders() {
  return apiRequest<WhatsAppSenderItem[]>("/whatsapp-senders", {
    method: "GET",
    cache: "no-store",
  });
}

export async function createWhatsAppSender(
  payload: CreateWhatsAppSenderPayload,
) {
  return apiRequest<WhatsAppSenderItem>("/whatsapp-senders", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function getMessages(filters: MessageFilters = {}) {
  return apiRequest<MessageItem[]>("/messages", {
    method: "GET",
    query: filters,
    cache: "no-store",
  });
}
