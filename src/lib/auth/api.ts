import { apiRequest } from "@/lib/api/client";
import type {
  AuthSession,
  SessionTenant,
  SessionUser,
} from "@/lib/auth/session";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type BootstrapTenantPayload = {
  tenant_name: string;
  tenant_slug: string;
  admin_email: string;
  admin_password: string;
};

type AuthSessionPayload = Omit<AuthSession, "issued_at">;

type CurrentUserResponse = {
  tenant: SessionTenant;
  user: SessionUser;
};

type BootstrapTenantResponse = {
  tenant: SessionTenant;
  user: SessionUser;
};

export async function loginWithPassword(credentials: LoginCredentials) {
  return apiRequest<AuthSessionPayload>("/auth/login", {
    method: "POST",
    body: credentials,
    cache: "no-store",
  });
}

export async function bootstrapTenant(payload: BootstrapTenantPayload) {
  return apiRequest<BootstrapTenantResponse>("/auth/bootstrap", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function resendVerificationEmail(email: string) {
  return apiRequest<void>("/auth/resend-verification-email", {
    method: "POST",
    body: {
      email,
    },
    cache: "no-store",
  });
}

export async function refreshCurrentSession(refreshToken: string) {
  return apiRequest<AuthSessionPayload>("/auth/refresh", {
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
    cache: "no-store",
  });
}

export async function logoutCurrentSession(refreshToken: string) {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    body: {
      refresh_token: refreshToken,
    },
    cache: "no-store",
  });
}

export async function getCurrentUser(accessToken: string) {
  return apiRequest<CurrentUserResponse>("/auth/me", {
    method: "GET",
    accessToken,
    cache: "no-store",
  });
}
