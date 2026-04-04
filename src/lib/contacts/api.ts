import { apiRequest } from "@/lib/api/client";
import type {
  ContactFilters,
  ContactItem,
  CreateContactPayload,
  UpdateContactPayload,
} from "@/lib/contacts/types";

export async function getContacts(filters: ContactFilters = {}) {
  return apiRequest<ContactItem[]>("/contacts", {
    method: "GET",
    query: filters,
    cache: "no-store",
  });
}

export async function createContact(payload: CreateContactPayload) {
  return apiRequest<ContactItem>("/contacts", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function updateContact(
  contactId: string,
  payload: UpdateContactPayload,
) {
  return apiRequest<ContactItem>(`/contacts/${contactId}`, {
    method: "PATCH",
    body: payload,
    cache: "no-store",
  });
}

export async function deleteContact(contactId: string) {
  return apiRequest<void>(`/contacts/${contactId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}
