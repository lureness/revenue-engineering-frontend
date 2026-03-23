"use client";

import { usePathname, useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthRouteState } from "@/components/auth/auth-route-state";

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuth();

  useEffect(() => {
    if (status !== "unauthenticated") {
      return;
    }

    const query = new URLSearchParams({
      redirectTo: pathname || "/workspace/[slug]",
    });

    router.replace(`/login?${query.toString()}`);
  }, [pathname, router, status]);

  if (status === "loading") {
    return (
      <AuthRouteState
        eyebrow="Autenticação"
        title="Carregando a sua sessão"
        description="Estamos validando o estado local antes de abrir a área autenticada."
      />
    );
  }

  if (status === "unauthenticated") {
    return (
      <AuthRouteState
        eyebrow="Redirecionando"
        title="Você precisa entrar para continuar"
        description="A área privada do produto depende de uma sessão válida. Vamos te levar para o login."
      />
    );
  }

  return children;
}
