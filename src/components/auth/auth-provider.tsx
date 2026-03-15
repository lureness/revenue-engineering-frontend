"use client";

import {
  createContext,
  type PropsWithChildren,
  use,
  useEffect,
  useState,
} from "react";

import { ApiClientError } from "@/lib/api/client";
import {
  getCurrentUser,
  type LoginCredentials,
  loginWithPassword,
  logoutCurrentSession,
  refreshCurrentSession,
} from "@/lib/auth/api";
import {
  type AuthSession,
  clearAuthSession,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  readAuthSession,
  type SessionTenant,
  type SessionUser,
  writeAuthSession,
} from "@/lib/auth/session";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  session: AuthSession | null;
  tenant: SessionTenant | null;
  user: SessionUser | null;
  signIn: (credentials: LoginCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mergeCurrentUser(
  session: AuthSession,
  currentUser: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  return {
    ...session,
    tenant: currentUser.tenant,
    user: currentUser.user,
  } satisfies AuthSession;
}

async function refreshStoredSession({
  setSession,
  setStatus,
}: {
  setSession: (value: AuthSession | null) => void;
  setStatus: (value: AuthStatus) => void;
}) {
  const storedSession = readAuthSession();

  if (!storedSession || isRefreshTokenExpired(storedSession)) {
    clearAuthSession();
    setSession(null);
    setStatus("unauthenticated");
    return null;
  }

  try {
    const refreshedSession = writeAuthSession(
      await refreshCurrentSession(storedSession.refresh_token),
    );
    const currentUser = await getCurrentUser(refreshedSession.access_token);
    const normalizedSession = writeAuthSession(
      mergeCurrentUser(refreshedSession, currentUser),
    );

    setSession(normalizedSession);
    setStatus("authenticated");
    return normalizedSession;
  } catch {
    clearAuthSession();
    setSession(null);
    setStatus("unauthenticated");
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  async function refreshSession() {
    return refreshStoredSession({
      setSession,
      setStatus,
    });
  }

  async function signIn(credentials: LoginCredentials) {
    const nextSession = writeAuthSession(await loginWithPassword(credentials));
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }

  async function signOut() {
    const currentSession = session ?? readAuthSession();

    try {
      if (currentSession?.refresh_token) {
        await logoutCurrentSession(currentSession.refresh_token);
      }
    } finally {
      clearAuthSession();
      setSession(null);
      setStatus("unauthenticated");
    }
  }

  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      const storedSession = readAuthSession();

      if (!storedSession) {
        if (!isActive) {
          return;
        }
        setSession(null);
        setStatus("unauthenticated");
        return;
      }

      if (isRefreshTokenExpired(storedSession)) {
        clearAuthSession();
        if (!isActive) {
          return;
        }
        setSession(null);
        setStatus("unauthenticated");
        return;
      }

      if (!isAccessTokenExpired(storedSession)) {
        if (!isActive) {
          return;
        }
        setSession(storedSession);
        setStatus("authenticated");
        return;
      }

      const refreshedSession = await refreshStoredSession({
        setSession,
        setStatus,
      });

      if (!isActive || refreshedSession) {
        return;
      }

      setSession(null);
      setStatus("unauthenticated");
    }

    void hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AuthContext
      value={{
        status,
        isAuthenticated: status === "authenticated" && Boolean(session),
        session,
        tenant: session?.tenant ?? null,
        user: session?.user ?? null,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}
