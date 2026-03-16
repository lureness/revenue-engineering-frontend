import { apiRequest } from "@/lib/api/client";
import type {
  CreateWhatsAppSenderPayload,
  MessageFilters,
  MessageItem,
  ProviderAccountItem,
  ProvisionTwilioSubaccountPayload,
  ProvisionTwilioWhatsAppSenderPayload,
  VerifyTwilioWhatsAppSenderPayload,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";

export async function getProviderAccounts() {
  return apiRequest<ProviderAccountItem[]>("/provider-accounts", {
    method: "GET",
    cache: "no-store",
  });
}

export async function provisionTwilioSubaccount(
  payload: ProvisionTwilioSubaccountPayload,
) {
  return apiRequest<ProviderAccountItem>(
    "/provider-accounts/twilio/subaccount",
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
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

export async function provisionTwilioWhatsAppSender(
  whatsappSenderId: string,
  payload: ProvisionTwilioWhatsAppSenderPayload,
) {
  return apiRequest<WhatsAppSenderItem>(
    `/whatsapp-senders/${whatsappSenderId}/twilio/provision`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function verifyTwilioWhatsAppSender(
  whatsappSenderId: string,
  payload: VerifyTwilioWhatsAppSenderPayload,
) {
  return apiRequest<WhatsAppSenderItem>(
    `/whatsapp-senders/${whatsappSenderId}/twilio/verify`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function syncTwilioWhatsAppSender(whatsappSenderId: string) {
  return apiRequest<WhatsAppSenderItem>(
    `/whatsapp-senders/${whatsappSenderId}/twilio/sync`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function getMessages(filters: MessageFilters = {}) {
  return apiRequest<MessageItem[]>("/messages", {
    method: "GET",
    query: filters,
    cache: "no-store",
  });
}
