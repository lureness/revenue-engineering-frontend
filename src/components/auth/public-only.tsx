"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { resolveSafeRedirectPath } from "@/lib/auth/navigation";

export function PublicOnly({ children }: PropsWithChildren) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    router.replace(
      resolveSafeRedirectPath(searchParams.get("redirectTo"), "/app"),
    );
  }, [router, searchParams, status]);

  if (status === "loading") {
    return (
      <AuthRouteState
        eyebrow="Autenticação"
        title="Validando sessão existente"
        description="Se você já estiver autenticado, vamos te levar direto para o workspace."
      />
    );
  }

  if (status === "authenticated") {
    return (
      <AuthRouteState
        eyebrow="Redirecionando"
        title="Sessão já iniciada"
        description="Sua conta já está autenticada. Estamos abrindo o workspace."
      />
    );
  }

  return children;
}
