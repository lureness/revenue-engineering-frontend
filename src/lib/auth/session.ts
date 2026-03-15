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
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  tenant: SessionTenant;
  user: SessionUser;
  issued_at: string;
};

export const AUTH_SESSION_STORAGE_KEY = "lureness.auth.session";
const EXPIRATION_SKEW_MS = 30_000;

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function readAuthSession() {
  if (!canUseStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

function resolveIssuedAt(
  session: Omit<AuthSession, "issued_at"> | AuthSession,
) {
  return "issued_at" in session ? session.issued_at : new Date().toISOString();
}

export function writeAuthSession(
  session: Omit<AuthSession, "issued_at"> | AuthSession,
) {
  if (!canUseStorage()) {
    return {
      ...session,
      issued_at: resolveIssuedAt(session),
    };
  }

  const payload: AuthSession = {
    ...session,
    issued_at: resolveIssuedAt(session),
  };

  window.localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(payload),
  );

  return payload;
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

export function getStoredAccessToken() {
  return readAuthSession()?.access_token ?? null;
}

function getIssuedAtDate(session: AuthSession) {
  const timestamp = Date.parse(session.issued_at);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function getAccessTokenExpiresAt(session: AuthSession) {
  return getIssuedAtDate(session) + session.expires_in * 1000;
}

export function getRefreshTokenExpiresAt(session: AuthSession) {
  return getIssuedAtDate(session) + session.refresh_expires_in * 1000;
}

export function isAccessTokenExpired(session: AuthSession) {
  return getAccessTokenExpiresAt(session) <= Date.now() + EXPIRATION_SKEW_MS;
}

export function isRefreshTokenExpired(session: AuthSession) {
  return getRefreshTokenExpiresAt(session) <= Date.now() + EXPIRATION_SKEW_MS;
}
