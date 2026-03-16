"use client";

import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import { ApiClientError } from "@/lib/api/client";
import {
  getCurrentUser,
  type LoginCredentials,
  loginWithPassword,
  logoutCurrentSession,
} from "@/lib/auth/api";
import { AUTH_UNAUTHORIZED_EVENT } from "@/lib/auth/events";
import type {
  AuthSession,
  SessionTenant,
  SessionUser,
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
  invalidateSession: () => void;
  refreshSession: () => Promise<AuthSession | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  const invalidateSession = useCallback(() => {
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  async function refreshSession() {
    try {
      const nextSession = await getCurrentUser();
      setSession(nextSession);
      setStatus("authenticated");
      return nextSession;
    } catch {
      invalidateSession();
      return null;
    }
  }

  async function signIn(credentials: LoginCredentials) {
    const nextSession = await loginWithPassword(credentials);
    setSession(nextSession);
    setStatus("authenticated");
    return nextSession;
  }

  async function signOut() {
    try {
      await logoutCurrentSession();
    } finally {
      invalidateSession();
    }
  }

  useEffect(() => {
    let isActive = true;

    async function hydrateSession() {
      try {
        const nextSession = await getCurrentUser();

        if (!isActive) {
          return;
        }

        setSession(nextSession);
        setStatus("authenticated");
      } catch {
        if (!isActive) {
          return;
        }

        setSession(null);
        setStatus("unauthenticated");
      }
    }

    void hydrateSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      invalidateSession();
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, [invalidateSession]);

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
        invalidateSession,
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
