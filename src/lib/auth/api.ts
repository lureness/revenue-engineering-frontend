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

type AuthSessionPayload = Omit<AuthSession, "issued_at">;

type CurrentUserResponse = {
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
