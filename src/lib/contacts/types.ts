export type ContactSource = "manual" | "import" | "inbound" | "api";

export type ContactItem = {
  id: string;
  tenant_id: string;
  created_by_user_id: string | null;
  name: string;
  email: string | null;
  phone_number: string | null;
  source: ContactSource;
  created_at: string;
  updated_at: string;
};

export type ContactFilters = {
  search?: string;
  limit?: number;
};

export type CreateContactPayload = {
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  source?: ContactSource;
};

export type UpdateContactPayload = {
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  source?: ContactSource;
};
