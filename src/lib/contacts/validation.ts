import type {
  ContactSource,
  CreateContactPayload,
  UpdateContactPayload,
} from "@/lib/contacts/types";

type ContactDraft = {
  name: string;
  email: string;
  phoneNumber: string;
  source: ContactSource;
};

export function hasReachableContactChannel({
  email,
  phoneNumber,
}: {
  email: string;
  phoneNumber: string;
}) {
  return Boolean(email.trim() || phoneNumber.trim());
}

export function getContactSourceLabel(source: string) {
  switch (source) {
    case "manual":
      return "Manual";
    case "import":
      return "Importação";
    case "inbound":
      return "Inbound";
    case "api":
      return "API";
    default:
      return source;
  }
}

export function buildContactPayload(
  draft: ContactDraft,
): CreateContactPayload | UpdateContactPayload {
  const normalizedName = draft.name.trim();
  const normalizedEmail = draft.email.trim();
  const normalizedPhoneNumber = draft.phoneNumber.trim();

  return {
    name: normalizedName || null,
    email: normalizedEmail || null,
    phone_number: normalizedPhoneNumber || null,
    source: draft.source,
  };
}
