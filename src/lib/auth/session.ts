export type SessionTenant = {
  id: string;
  name: string;
  slug: string;
};

export type SessionUser = {
  id: string;
  tenant_id: string;
  email: string;
  email_verified_at: string | null;
  role: string;
  is_active: boolean;
};

export type AuthSession = {
  tenant: SessionTenant;
  user: SessionUser;
};
