import { apiRequest } from "@/lib/api/client";
import type {
  AgentRunItem,
  AgentRunSummaryItem,
  AssignConversationPayload,
  ConversationActionResponse,
  CreateStandardMessagePayload,
  InboxConversationDetail,
  InboxConversationFilters,
  InboxConversationListResponse,
  InboxMessageItem,
  SendConversationMessagePayload,
  StandardMessageItem,
  UpdateStandardMessagePayload,
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

export async function pauseInboxConversationAgent(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/agent/pause`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function resumeInboxConversationAgent(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/agent/resume`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function takeoverInboxConversationAgent(conversationId: string) {
  return apiRequest<ConversationActionResponse>(
    `/inbox/conversations/${conversationId}/agent/takeover`,
    {
      method: "POST",
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

export async function getLatestInboxConversationAnalysis(
  conversationId: string,
) {
  return apiRequest<AgentRunSummaryItem | null>(
    `/inbox/conversations/${conversationId}/analysis/latest`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function rerunInboxConversationAnalysis(conversationId: string) {
  return apiRequest<AgentRunItem>(
    `/inbox/conversations/${conversationId}/analysis`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function getInboxStandardMessages(query?: {
  channel?: string;
  active_only?: boolean;
}) {
  return apiRequest<StandardMessageItem[]>("/inbox/standard-messages", {
    method: "GET",
    query,
    cache: "no-store",
  });
}

export async function createInboxStandardMessage(
  payload: CreateStandardMessagePayload,
) {
  return apiRequest<StandardMessageItem>("/inbox/standard-messages", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function updateInboxStandardMessage(
  standardMessageId: string,
  payload: UpdateStandardMessagePayload,
) {
  return apiRequest<StandardMessageItem>(
    `/inbox/standard-messages/${standardMessageId}`,
    {
      method: "PATCH",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function deleteInboxStandardMessage(standardMessageId: string) {
  return apiRequest(`/inbox/standard-messages/${standardMessageId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
