"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";

type PublicLandingSessionLinkProps = {
  authenticatedLabel?: string;
  unauthenticatedLabel?: string;
  className: string;
};

export function PublicLandingSessionLink({
  authenticatedLabel = "Ir para workspace",
  unauthenticatedLabel = "Cadastrar",
  className,
}: PublicLandingSessionLinkProps) {
  const { status, tenant } = useAuth();

  if (status === "authenticated" && tenant?.slug) {
    return (
      <Link href={`/workspace/${tenant.slug}`} className={className}>
        {authenticatedLabel}
      </Link>
    );
  }

  return (
    <Link href="/signup" className={className}>
      {unauthenticatedLabel}
    </Link>
  );
}
