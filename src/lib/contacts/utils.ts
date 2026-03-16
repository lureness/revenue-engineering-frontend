import type { ContactSource } from "@/lib/contacts/types";

const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  manual: "Manual",
  import: "Importação",
  inbound: "Inbound",
  api: "API",
};

export function getContactSourceLabel(source: ContactSource) {
  return CONTACT_SOURCE_LABELS[source];
}

export function hasReachableContactChannel(
  email?: string | null,
  phoneNumber?: string | null,
) {
  return Boolean(email?.trim() || phoneNumber?.trim());
}
