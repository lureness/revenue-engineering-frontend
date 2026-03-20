import { apiRequest } from "@/lib/api/client";
import type {
  AssignConversationPayload,
  ConversationActionResponse,
  InboxConversationDetail,
  InboxConversationFilters,
  InboxConversationListResponse,
  InboxMessageItem,
  SendConversationMessagePayload,
} from "@/lib/inbox/types";

export async function getInboxConversations(
  filters: InboxConversationFilters = {},
) {
  return apiRequest<InboxConversationListResponse>("/inbox/conversations", {
    method: "GET",
    query: filters,
    cache: "no-store",
  });
}

export async function getInboxConversationDetail(
  conversationId: string,
  query?: {
    messages_limit?: number;
    messages_offset?: number;
  },
) {
  return apiRequest<InboxConversationDetail>(
    `/inbox/conversations/${conversationId}`,
    {
      method: "GET",
      query,
      cache: "no-store",
    },
  );
}

export async function markInboxConversationAsRead(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/read`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function closeInboxConversation(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/close`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function reopenInboxConversation(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/reopen`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function assignInboxConversation(
  conversationId: string,
  payload: AssignConversationPayload,
) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/assign`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function sendInboxConversationMessage(
  conversationId: string,
  payload: SendConversationMessagePayload,
) {
  return apiRequest<InboxMessageItem>(
    `/inbox/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}
