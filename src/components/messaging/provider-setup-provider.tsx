"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAccess } from "@/components/access/access-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { getProviderAccounts, getWhatsAppSenders } from "@/lib/messaging/api";
import {
  type ProviderSetupStep,
  resolveProviderSetupStep,
} from "@/lib/messaging/onboarding";
import {
  TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  TENANT_WHATSAPP_SENDERS_MANAGE_PERMISSION,
  TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
} from "@/lib/rbac/permissions";

type ProviderSetupContextValue = {
  isLoading: boolean;
  canShow: boolean;
  canManage: boolean;
  isProviderReady: boolean;
  currentStep: ProviderSetupStep;
  hasProviderAccount: boolean;
  hasSender: boolean;
  refresh: () => Promise<void>;
};

const ProviderSetupContext = createContext<ProviderSetupContextValue | null>(
  null,
);

export function ProviderSetupProvider({ children }: PropsWithChildren) {
  const { tenant } = useAuth();
  const { hasTenantPermission, status: accessStatus } = useAccess();
  const pathname = usePathname();
  const [hasProviderAccount, setHasProviderAccount] = useState(false);
  const [hasSender, setHasSender] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const canReadProviderAccounts = hasTenantPermission(
    TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  );
  const canManageProviderAccounts = hasTenantPermission(
    TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION,
  );
  const canReadSenders = hasTenantPermission(
    TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
  );
  const canManageSenders = hasTenantPermission(
    TENANT_WHATSAPP_SENDERS_MANAGE_PERMISSION,
  );

  const canInspectProviderSetup =
    canReadProviderAccounts ||
    canManageProviderAccounts ||
    canReadSenders ||
    canManageSenders;
  const canManage = canManageProviderAccounts || canManageSenders;

  const refresh = useCallback(async () => {
    if (accessStatus !== "ready" || !tenant?.slug || !canInspectProviderSetup) {
      setHasProviderAccount(false);
      setHasSender(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [providerAccounts, senders] = await Promise.all([
        canReadProviderAccounts || canManageProviderAccounts
          ? getProviderAccounts()
          : Promise.resolve([]),
        canReadSenders || canManageSenders
          ? getWhatsAppSenders()
          : Promise.resolve([]),
      ]);

      setHasProviderAccount(providerAccounts.length > 0);
      setHasSender(senders.length > 0);
    } catch {
      setHasProviderAccount(false);
      setHasSender(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    accessStatus,
    canInspectProviderSetup,
    canManageProviderAccounts,
    canManageSenders,
    canReadProviderAccounts,
    canReadSenders,
    tenant?.slug,
  ]);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    void refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    function handleWindowFocus() {
      void refresh();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refresh]);

  const currentStep = useMemo(
    () =>
      resolveProviderSetupStep({
        hasProviderAccount,
        hasSender,
      }),
    [hasProviderAccount, hasSender],
  );

  return (
    <ProviderSetupContext
      value={{
        isLoading,
        canShow: canManage && currentStep !== "ready",
        canManage,
        isProviderReady: currentStep === "ready",
        currentStep,
        hasProviderAccount,
        hasSender,
        refresh,
      }}
    >
      {children}
    </ProviderSetupContext>
  );
}

export function useProviderSetup() {
  const context = use(ProviderSetupContext);

  if (!context) {
    throw new Error(
      "useProviderSetup must be used within a ProviderSetupProvider",
    );
  }

  return context;
}
