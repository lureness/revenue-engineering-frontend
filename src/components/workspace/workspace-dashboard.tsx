"use client";

import {
  BookUser,
  Bot,
  FileText,
  Layers3,
  MessageCircleMore,
  MessageSquareText,
  Smartphone,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getWorkspaceDashboardData,
  type WorkspaceDashboardData,
} from "@/lib/workspace/api";

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof Layers3;
  href: string;
};

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
}: MetricCardProps) {
  return (
    <Link href={href} className="block" scroll={false}>
      <Card className="bg-card/85 transition-colors hover:bg-card/95 hover:border-primary/30">
        <CardContent className="grid gap-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground/10 text-foreground">
              <Icon className="size-4" />
            </span>
          </div>
          <div className="space-y-2">
            <p className="font-serif text-4xl tracking-tight text-foreground">
              {value}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetricCardSkeleton() {
  return (
    <Card className="bg-card/85">
      <CardContent className="grid gap-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="size-10 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

type WorkspaceDashboardProps = {
  tenantSlug: string;
};

export function WorkspaceDashboard({ tenantSlug }: WorkspaceDashboardProps) {
  const [data, setData] = useState<WorkspaceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const dashboardData = await getWorkspaceDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError("Não foi possível carregar os dados do workspace.");
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          "skeleton-1",
          "skeleton-2",
          "skeleton-3",
          "skeleton-4",
          "skeleton-5",
          "skeleton-6",
          "skeleton-7",
          "skeleton-8",
        ].map((key) => (
          <MetricCardSkeleton key={key} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
        {error}
      </div>
    );
  }

  const basePath = `/workspace/${tenantSlug}`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Times"
        value={data?.teamsCount ?? 0}
        description="Times criados no workspace"
        icon={UsersRound}
        href={`${basePath}/teams`}
      />
      <MetricCard
        label="Contatos"
        value={data?.contactsCount ?? 0}
        description="Contatos na base de dados"
        icon={BookUser}
        href={`${basePath}/inbox/contacts`}
      />
      <MetricCard
        label="Agentes"
        value={data?.agentsCount ?? 0}
        description="Agentes configurados"
        icon={Bot}
        href={`${basePath}/agents`}
      />
      <MetricCard
        label="Surveys"
        value={data?.surveysCount ?? 0}
        description="Surveys publicados"
        icon={FileText}
        href={`${basePath}/surveys`}
      />
      <MetricCard
        label="LPs"
        value={0}
        description="Landing pages criadas"
        icon={Layers3}
        href={`${basePath}/lp`}
      />
      <MetricCard
        label="Iscas"
        value={0}
        description="Iscas digitais cadastradas"
        icon={MessageSquareText}
        href={`${basePath}/hooks`}
      />
      <MetricCard
        label="Conversas"
        value={data?.conversationsCount ?? 0}
        description="Conversas no inbox"
        icon={MessageCircleMore}
        href={`${basePath}/inbox`}
      />
      <MetricCard
        label="Senders"
        value={data?.sendersCount ?? 0}
        description="Senders WhatsApp ativos"
        icon={Smartphone}
        href={`${basePath}/inbox/messages`}
      />
    </div>
  );
}
