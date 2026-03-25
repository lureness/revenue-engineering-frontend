"use client";

import { Activity, ChevronRight, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useAccess } from "@/components/access/access-provider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  TENANT_AUDIT_LOGS_READ_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_METRICS_READ_PERMISSION,
  TENANT_PERMISSIONS_MANAGE_PERMISSION,
} from "@/lib/rbac/permissions";

type SettingsOverviewProps = {
  tenantSlug: string;
};

type SettingsCardItem = {
  title: string;
  description: string;
  href: string;
  badge: string;
  icon: typeof KeyRound;
  visible: boolean;
};

function SettingsCard({
  title,
  description,
  href,
  badge,
  icon: Icon,
}: Omit<SettingsCardItem, "visible">) {
  return (
    <Link href={href} className="block">
      <Card className="bg-card/85 shadow-sm transition-colors hover:border-primary/30 hover:bg-card/95">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary">{badge}</Badge>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
              <Icon className="size-4" />
            </span>
          </div>
          <CardTitle className="text-xl tracking-tight text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="leading-7">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm font-medium text-foreground">
          <span>Abrir configuração</span>
          <ChevronRight className="size-4" />
        </CardContent>
      </Card>
    </Link>
  );
}

export function SettingsOverview({ tenantSlug }: SettingsOverviewProps) {
  const { hasTenantPermission, status } = useAccess();

  const canReadObservability =
    status !== "ready" ||
    hasTenantPermission(TENANT_METRICS_READ_PERMISSION) ||
    hasTenantPermission(TENANT_AUDIT_LOGS_READ_PERMISSION);

  const canReadRbac =
    status !== "ready" ||
    hasTenantPermission(TENANT_MEMBERS_READ_PERMISSION) ||
    hasTenantPermission(TENANT_PERMISSIONS_MANAGE_PERMISSION);

  const items: SettingsCardItem[] = [
    {
      title: "Minha conta",
      description:
        "Atualize a senha da conta autenticada e mantenha o acesso sob controle.",
      href: `/workspace/${tenantSlug}/settings/account`,
      badge: "Conta",
      icon: KeyRound,
      visible: true,
    },
    {
      title: "Observabilidade",
      description:
        "Investigue métricas, erros e drilldowns operacionais do workspace.",
      href: `/workspace/${tenantSlug}/settings/observability`,
      badge: "Monitoramento",
      icon: Activity,
      visible: canReadObservability,
    },
    {
      title: "RBAC",
      description:
        "Gerencie members, roles, grants diretos e permissões efetivas.",
      href: `/workspace/${tenantSlug}/settings/rbac`,
      badge: "Acesso",
      icon: ShieldCheck,
      visible: canReadRbac,
    },
  ].filter((item) => item.visible);

  if (items.length === 0) {
    return (
      <Empty className="py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldCheck className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Nenhuma configuração disponível</EmptyTitle>
          <EmptyDescription>
            O seu acesso atual não libera áreas adicionais de configuração neste
            workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <SettingsCard key={item.href} {...item} />
      ))}
    </div>
  );
}
