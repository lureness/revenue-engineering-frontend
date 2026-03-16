"use client";

import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { getMyEffectivePermissions } from "@/lib/rbac/api";
import {
  hasTeamPermission as hasTeamPermissionInSet,
  hasTenantPermission as hasTenantPermissionInSet,
} from "@/lib/rbac/permissions";
import type { EffectivePermissionsResponse } from "@/lib/rbac/types";

type AccessStatus = "idle" | "loading" | "ready";

type AccessContextValue = {
  status: AccessStatus;
  permissions: EffectivePermissionsResponse | null;
  hasTenantPermission: (permissionCode: string) => boolean;
  hasTeamPermission: (
    teamId: string | null | undefined,
    permissionCode: string,
  ) => boolean;
  refreshPermissions: () => Promise<EffectivePermissionsResponse | null>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: PropsWithChildren) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<AccessStatus>("idle");
  const [permissions, setPermissions] =
    useState<EffectivePermissionsResponse | null>(null);

  const refreshPermissions = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setPermissions(null);
      setStatus("idle");
      return null;
    }

    setStatus("loading");

    try {
      const nextPermissions = await getMyEffectivePermissions();
      setPermissions(nextPermissions);
      setStatus("ready");
      return nextPermissions;
    } catch {
      setPermissions(null);
      setStatus("idle");
      return null;
    }
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setPermissions(null);
      setStatus("idle");
      return;
    }

    void refreshPermissions();
  }, [authStatus, refreshPermissions]);

  return (
    <AccessContext
      value={{
        status,
        permissions,
        hasTenantPermission: (permissionCode) =>
          hasTenantPermissionInSet(permissions, permissionCode),
        hasTeamPermission: (teamId, permissionCode) =>
          hasTeamPermissionInSet(permissions, teamId, permissionCode),
        refreshPermissions,
      }}
    >
      {children}
    </AccessContext>
  );
}

export function useAccess() {
  const context = use(AccessContext);

  if (!context) {
    throw new Error("useAccess must be used within an AccessProvider");
  }

  return context;
}
