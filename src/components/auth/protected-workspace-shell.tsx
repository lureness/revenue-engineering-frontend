"use client";

import { useRouter } from "next/navigation";
import { type PropsWithChildren, startTransition, useState } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";

export function ProtectedWorkspaceShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const { signOut, tenant, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      startTransition(() => {
        router.replace("/login");
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <AuthGuard>
      <AppShell
        tenantName={tenant?.name}
        userEmail={user?.email}
        userRole={user?.role}
        onSignOut={handleSignOut}
        signOutPending={isSigningOut}
      >
        {children}
      </AppShell>
    </AuthGuard>
  );
}
