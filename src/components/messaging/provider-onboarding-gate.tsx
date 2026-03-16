"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { getProviderAccounts } from "@/lib/messaging/api";
import { shouldRedirectToProviderSetup } from "@/lib/messaging/onboarding";
import { TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION } from "@/lib/rbac/permissions";

export function ProviderOnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { hasTenantPermission, status: accessStatus } = useAccess();
  const [needsProviderSetup, setNeedsProviderSetup] = useState(false);
  const canManageProviderAccounts = hasTenantPermission(
    TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION,
  );

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (accessStatus !== "ready") {
      return;
    }

    if (!canManageProviderAccounts) {
      setNeedsProviderSetup(false);
      return;
    }

    setNeedsProviderSetup(false);

    let isActive = true;

    async function loadProviderAccounts() {
      try {
        const providerAccounts = await getProviderAccounts();

        if (!isActive) {
          return;
        }

        setNeedsProviderSetup(providerAccounts.length === 0);
      } catch {
        if (!isActive) {
          return;
        }

        setNeedsProviderSetup(false);
      }
    }

    void loadProviderAccounts();

    return () => {
      isActive = false;
    };
  }, [accessStatus, canManageProviderAccounts, pathname]);

  useEffect(() => {
    if (!needsProviderSetup) {
      return;
    }

    if (!shouldRedirectToProviderSetup(pathname)) {
      return;
    }

    router.replace("/app/messaging?setup=provider");
  }, [needsProviderSetup, pathname, router]);

  return null;
}
