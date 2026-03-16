import { apiRequest } from "@/lib/api/client";
import type { AuthSession } from "@/lib/auth/session";

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

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

type BootstrapTenantResponse = AuthSession;

export async function loginWithPassword(credentials: LoginCredentials) {
  return apiRequest<AuthSession>("/auth/login", {
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

export async function verifyEmailToken(token: string) {
  return apiRequest<void>("/auth/verify-email", {
    method: "POST",
    body: {
      token,
    },
    cache: "no-store",
  });
}

export async function forgotPassword(email: string) {
  return apiRequest<void>("/auth/forgot-password", {
    method: "POST",
    body: {
      email,
    },
    cache: "no-store",
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: {
      token,
      new_password: newPassword,
    },
    cache: "no-store",
  });
}

export async function logoutCurrentSession() {
  return apiRequest<void>("/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
}

export async function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<void>("/auth/change-password", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function getCurrentUser() {
  return apiRequest<AuthSession>("/auth/me", {
    method: "GET",
    cache: "no-store",
  });
}
