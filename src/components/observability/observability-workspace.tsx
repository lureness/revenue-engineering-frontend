"use client";

import {
  Activity,
  AlertTriangle,
  Building2,
  Gauge,
  Loader2,
  Lock,
  MessagesSquare,
  Radar,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { ObservabilityDashboard } from "@/components/observability/observability-dashboard";
import { ObservabilityExplorer } from "@/components/observability/observability-explorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { getProviderAccounts, getWhatsAppSenders } from "@/lib/messaging/api";
import type {
  ProviderAccountItem,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";
import {
  getAccessUserDrilldown,
  getAuthUserDrilldown,
  getMessagingProviderAccountDrilldown,
  getMessagingSenderDrilldown,
  getObservabilityDrilldowns,
  getTeamDrilldown,
} from "@/lib/observability/api";
import {
  getObservabilityDrilldownDomainLabel,
  groupObservabilityDrilldowns,
} from "@/lib/observability/drilldowns";
import {
  formatDateTime,
  formatDuration,
  formatPercentage,
  formatRequestCount,
} from "@/lib/observability/format";
import type {
  ApiRequestLogItem,
  ObservabilityDashboardInsightGroupItem,
  ObservabilityDrilldownDefinitionItem,
  ObservabilityDrilldownItem,
} from "@/lib/observability/types";
import { getTenantUsers } from "@/lib/rbac/api";
import {
  TENANT_AUDIT_LOGS_READ_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_METRICS_READ_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import type { TenantUserItem } from "@/lib/rbac/types";
import { getTeams } from "@/lib/teams/api";
import type { TeamItem } from "@/lib/teams/types";
import { cn } from "@/lib/utils";

const HOURS_OPTIONS = [
  { label: "24h", value: 24 },
  { label: "72h", value: 72 },
  { label: "7d", value: 168 },
] as const;

type EntityOption = {
  value: string;
  label: string;
};

type ActiveDrilldown = {
  code: string;
  entityId: string;
};

type DrilldownLauncherCardProps = {
  badge: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
};

type EntitySelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: EntityOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

function EntitySelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: EntitySelectProps) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <select
        className="h-11 w-full rounded-[1rem] border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DrilldownLauncherCard({
  badge,
  title,
  description,
  icon: Icon,
  children,
}: DrilldownLauncherCardProps) {
  return (
    <Card className="bg-card/85 shadow-sm">
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
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

function DrilldownSummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="grid gap-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{label}</Badge>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <p className="font-serif text-3xl tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DrilldownInsightGroupCard({
  group,
}: {
  group: ObservabilityDashboardInsightGroupItem;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg tracking-tight text-foreground">
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {group.metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {metric.label}
                </p>
                {metric.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {metric.description}
                  </p>
                ) : null}
              </div>
              <span className="font-serif text-2xl tracking-tight text-foreground">
                {typeof metric.value === "number"
                  ? formatRequestCount(metric.value)
                  : metric.value}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RecentErrorsList({ errors }: { errors: ApiRequestLogItem[] }) {
  if (errors.length === 0) {
    return (
      <Empty className="border border-border/70 bg-background/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Nenhum erro recente</EmptyTitle>
          <EmptyDescription>
            Esse recorte da entidade não registrou falhas recentes.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-3">
      {errors.map((item) => (
        <div
          key={item.id}
          className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{item.status_code}</Badge>
                <span className="text-sm font-medium text-foreground">
                  {item.method} {item.route_path}
                </span>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {item.error_detail ?? "Erro sem detalhe adicional."}
              </p>
            </div>
            <div className="text-right text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <div>{formatDateTime(item.created_at)}</div>
              <div className="mt-1">{formatDuration(item.duration_ms)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return formatRequestCount(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Vazio";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function getProviderAccountOptionLabel(account: ProviderAccountItem) {
  const friendlyName =
    typeof account.configuration?.friendly_name === "string"
      ? account.configuration.friendly_name
      : null;

  return friendlyName
    ? `${friendlyName} · ${account.account_sid}`
    : `${account.provider.toUpperCase()} · ${account.account_sid}`;
}

function getSenderOptionLabel(sender: WhatsAppSenderItem) {
  return sender.display_name
    ? `${sender.display_name} · ${sender.phone_number}`
    : sender.phone_number;
}

export function ObservabilityWorkspace() {
  const { status: accessStatus, hasTenantPermission } = useAccess();
  const canReadAuditLogs = hasTenantPermission(
    TENANT_AUDIT_LOGS_READ_PERMISSION,
  );
  const canReadMetrics = hasTenantPermission(TENANT_METRICS_READ_PERMISSION);
  const canReadMembers = hasTenantPermission(TENANT_MEMBERS_READ_PERMISSION);
  const canReadProviderAccounts = hasTenantPermission(
    TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  );
  const canReadSenders = hasTenantPermission(
    TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
  );

  const [selectedHours, setSelectedHours] = useState(24);
  const [drilldownDefinitions, setDrilldownDefinitions] = useState<
    ObservabilityDrilldownDefinitionItem[]
  >([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [providerAccounts, setProviderAccounts] = useState<
    ProviderAccountItem[]
  >([]);
  const [senders, setSenders] = useState<WhatsAppSenderItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedProviderAccountId, setSelectedProviderAccountId] =
    useState("");
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [activeDrilldown, setActiveDrilldown] =
    useState<ActiveDrilldown | null>(null);
  const [drilldown, setDrilldown] = useState<ObservabilityDrilldownItem | null>(
    null,
  );
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isLoadingDrilldown, setIsLoadingDrilldown] = useState(false);
  const [drilldownError, setDrilldownError] = useState<string | null>(null);

  useEffect(() => {
    if (accessStatus !== "ready") {
      return;
    }

    if (!canReadMetrics) {
      setIsLoadingSetup(false);
      return;
    }

    let isActive = true;

    async function loadWorkspaceContext() {
      setIsLoadingSetup(true);
      setSetupError(null);

      const results = await Promise.allSettled([
        getObservabilityDrilldowns(),
        canReadMembers ? getTenantUsers() : Promise.resolve([]),
        getTeams(),
        canReadProviderAccounts ? getProviderAccounts() : Promise.resolve([]),
        canReadSenders ? getWhatsAppSenders() : Promise.resolve([]),
      ]);

      if (!isActive) {
        return;
      }

      const [
        definitionsResult,
        usersResult,
        teamsResult,
        providerAccountsResult,
        sendersResult,
      ] = results;

      const errors: string[] = [];

      if (definitionsResult.status === "fulfilled") {
        setDrilldownDefinitions(definitionsResult.value);
      } else {
        errors.push("Não foi possível carregar o catálogo de drilldowns.");
      }

      if (usersResult.status === "fulfilled") {
        setTenantUsers(usersResult.value);
      } else {
        errors.push("Não foi possível carregar os usuários do workspace.");
      }

      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value);
      } else {
        errors.push("Não foi possível carregar os times do workspace.");
      }

      if (providerAccountsResult.status === "fulfilled") {
        setProviderAccounts(providerAccountsResult.value);
      } else {
        errors.push("Não foi possível carregar as contas de provedor.");
      }

      if (sendersResult.status === "fulfilled") {
        setSenders(sendersResult.value);
      } else {
        errors.push("Não foi possível carregar os senders do WhatsApp.");
      }

      setSetupError(errors[0] ?? null);
      setIsLoadingSetup(false);
    }

    void loadWorkspaceContext();

    return () => {
      isActive = false;
    };
  }, [
    accessStatus,
    canReadMembers,
    canReadMetrics,
    canReadProviderAccounts,
    canReadSenders,
  ]);

  useEffect(() => {
    setSelectedUserId((currentValue) => {
      if (tenantUsers.length === 0) {
        return "";
      }

      return tenantUsers.some((user) => user.id === currentValue)
        ? currentValue
        : (tenantUsers[0]?.id ?? "");
    });
  }, [tenantUsers]);

  useEffect(() => {
    setSelectedTeamId((currentValue) => {
      if (teams.length === 0) {
        return "";
      }

      return teams.some((team) => team.id === currentValue)
        ? currentValue
        : (teams[0]?.id ?? "");
    });
  }, [teams]);

  useEffect(() => {
    setSelectedProviderAccountId((currentValue) => {
      if (providerAccounts.length === 0) {
        return "";
      }

      return providerAccounts.some((account) => account.id === currentValue)
        ? currentValue
        : (providerAccounts[0]?.id ?? "");
    });
  }, [providerAccounts]);

  useEffect(() => {
    setSelectedSenderId((currentValue) => {
      if (senders.length === 0) {
        return "";
      }

      return senders.some((sender) => sender.id === currentValue)
        ? currentValue
        : (senders[0]?.id ?? "");
    });
  }, [senders]);

  useEffect(() => {
    if (!activeDrilldown || !canReadMetrics) {
      return;
    }

    const currentDrilldown = activeDrilldown;
    let isActive = true;

    async function loadDrilldown() {
      setIsLoadingDrilldown(true);
      setDrilldownError(null);

      try {
        let nextDrilldown: ObservabilityDrilldownItem;

        switch (currentDrilldown.code) {
          case "auth.user":
            nextDrilldown = await getAuthUserDrilldown(
              currentDrilldown.entityId,
              {
                hours: selectedHours,
              },
            );
            break;
          case "access.user":
            nextDrilldown = await getAccessUserDrilldown(
              currentDrilldown.entityId,
              {
                hours: selectedHours,
              },
            );
            break;
          case "teams.team":
            nextDrilldown = await getTeamDrilldown(currentDrilldown.entityId, {
              hours: selectedHours,
            });
            break;
          case "messaging.provider_account":
            nextDrilldown = await getMessagingProviderAccountDrilldown(
              currentDrilldown.entityId,
              {
                hours: selectedHours,
              },
            );
            break;
          case "messaging.sender":
            nextDrilldown = await getMessagingSenderDrilldown(
              currentDrilldown.entityId,
              {
                hours: selectedHours,
              },
            );
            break;
          default:
            throw new Error("unsupported drilldown");
        }

        if (!isActive) {
          return;
        }

        setDrilldown(nextDrilldown);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDrilldown(null);
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível abrir o drilldown agora.",
        });
        setDrilldownError(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
      } finally {
        if (isActive) {
          setIsLoadingDrilldown(false);
        }
      }
    }

    void loadDrilldown();

    return () => {
      isActive = false;
    };
  }, [activeDrilldown, canReadMetrics, selectedHours]);

  const drilldownGroups = groupObservabilityDrilldowns(drilldownDefinitions);
  const drilldownDefinitionMap = new Map(
    drilldownDefinitions.map((definition) => [definition.code, definition]),
  );

  const userOptions = tenantUsers.map((user) => ({
    value: user.id,
    label: `${user.email} · ${user.role.toUpperCase()}`,
  }));
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: `${team.name} · ${team.slug}`,
  }));
  const providerAccountOptions = providerAccounts.map((account) => ({
    value: account.id,
    label: getProviderAccountOptionLabel(account),
  }));
  const senderOptions = senders.map((sender) => ({
    value: sender.id,
    label: getSenderOptionLabel(sender),
  }));

  const activeDefinition = activeDrilldown
    ? drilldownDefinitionMap.get(activeDrilldown.code)
    : null;

  if (
    accessStatus !== "ready" ||
    (isLoadingSetup && !drilldownDefinitions.length)
  ) {
    return (
      <Card className="bg-card/85 shadow-md">
        <CardContent className="flex min-h-80 items-center justify-center gap-3 pt-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Preparando a área de observabilidade...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!canReadMetrics && !canReadAuditLogs) {
    return (
      <Empty className="border border-border/70 bg-card/85 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Observabilidade indisponível</EmptyTitle>
          <EmptyDescription>
            Você não tem permissão para acessar métricas nem logs deste
            workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-8">
      {canReadMetrics ? <ObservabilityDashboard /> : null}

      {canReadMetrics ? (
        <section className="grid gap-4">
          <Card className="rounded-[2rem] bg-card/85 shadow-md">
            <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <Badge variant="secondary">Drilldowns por entidade</Badge>
                <div className="space-y-3">
                  <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
                    Exploração operacional do workspace
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    Selecione usuários, times, contas de provedor ou senders
                    para abrir o detalhe analítico de cada entidade. O backend
                    já correlaciona tráfego da API, métricas e erros recentes.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {drilldownGroups.map((group) => (
                    <Badge key={group.domain} variant="outline">
                      {group.label} · {group.items.length}
                    </Badge>
                  ))}
                </div>
              </div>

              <Card className="bg-background/70">
                <CardContent className="grid gap-4 pt-4">
                  <div className="space-y-2">
                    <Badge variant="outline">Catálogo</Badge>
                    <div className="grid gap-3">
                      {drilldownGroups.map((group) => (
                        <div
                          key={group.domain}
                          className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {group.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {group.items.map((item) => item.name).join(" · ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Badge variant="secondary">Janela do drilldown</Badge>
                    <div className="flex flex-wrap gap-2">
                      {HOURS_OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            option.value === selectedHours
                              ? "secondary"
                              : "outline"
                          }
                          onClick={() => setSelectedHours(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {setupError ? (
                    <>
                      <Separator />
                      <p className="text-sm leading-7 text-muted-foreground">
                        {setupError}
                      </p>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <DrilldownLauncherCard
              badge={getObservabilityDrilldownDomainLabel("auth")}
              title="Usuários do workspace"
              description={
                drilldownDefinitionMap.get("auth.user")?.description ??
                "Detalhe sessões, verificação e acesso efetivo de cada usuário."
              }
              icon={UserRound}
            >
              {canReadMembers ? (
                <>
                  <EntitySelect
                    label="Usuário"
                    placeholder="Selecione um usuário"
                    value={selectedUserId}
                    options={userOptions}
                    onChange={setSelectedUserId}
                    disabled={userOptions.length === 0}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setActiveDrilldown({
                          code: "auth.user",
                          entityId: selectedUserId,
                        })
                      }
                      disabled={!selectedUserId}
                    >
                      Abrir autenticação
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setActiveDrilldown({
                          code: "access.user",
                          entityId: selectedUserId,
                        })
                      }
                      disabled={!selectedUserId}
                    >
                      Abrir acesso
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
                  Você não pode listar usuários deste workspace. Esse drilldown
                  depende da leitura de membros.
                </div>
              )}
            </DrilldownLauncherCard>

            <DrilldownLauncherCard
              badge={getObservabilityDrilldownDomainLabel("teams")}
              title="Times"
              description={
                drilldownDefinitionMap.get("teams.team")?.description ??
                "Abra memberships, invites e atividade operacional de um time."
              }
              icon={UsersRound}
            >
              <EntitySelect
                label="Time"
                placeholder="Selecione um time"
                value={selectedTeamId}
                options={teamOptions}
                onChange={setSelectedTeamId}
                disabled={teamOptions.length === 0}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    setActiveDrilldown({
                      code: "teams.team",
                      entityId: selectedTeamId,
                    })
                  }
                  disabled={!selectedTeamId}
                >
                  Abrir drilldown do time
                </Button>
              </div>
            </DrilldownLauncherCard>

            <DrilldownLauncherCard
              badge={getObservabilityDrilldownDomainLabel("messaging")}
              title="Contas de provedor"
              description={
                drilldownDefinitionMap.get("messaging.provider_account")
                  ?.description ??
                "Inspecione infraestrutura, volume e saúde operacional da conta."
              }
              icon={Building2}
            >
              {canReadProviderAccounts ? (
                <>
                  <EntitySelect
                    label="Conta"
                    placeholder="Selecione uma conta"
                    value={selectedProviderAccountId}
                    options={providerAccountOptions}
                    onChange={setSelectedProviderAccountId}
                    disabled={providerAccountOptions.length === 0}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setActiveDrilldown({
                          code: "messaging.provider_account",
                          entityId: selectedProviderAccountId,
                        })
                      }
                      disabled={!selectedProviderAccountId}
                    >
                      Abrir conta de provedor
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
                  Você não pode visualizar contas de provedor neste workspace.
                </div>
              )}
            </DrilldownLauncherCard>

            <DrilldownLauncherCard
              badge={getObservabilityDrilldownDomainLabel("messaging")}
              title="Senders do WhatsApp"
              description={
                drilldownDefinitionMap.get("messaging.sender")?.description ??
                "Abra o detalhe de volume, status e atividade de cada sender."
              }
              icon={MessagesSquare}
            >
              {canReadSenders ? (
                <>
                  <EntitySelect
                    label="Sender"
                    placeholder="Selecione um sender"
                    value={selectedSenderId}
                    options={senderOptions}
                    onChange={setSelectedSenderId}
                    disabled={senderOptions.length === 0}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setActiveDrilldown({
                          code: "messaging.sender",
                          entityId: selectedSenderId,
                        })
                      }
                      disabled={!selectedSenderId}
                    >
                      Abrir sender
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground">
                  Você não pode visualizar senders do WhatsApp neste workspace.
                </div>
              )}
            </DrilldownLauncherCard>
          </div>
        </section>
      ) : (
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="pt-6">
            <Empty className="border border-border/70 bg-background/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Lock className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Dashboard e drilldowns indisponíveis</EmptyTitle>
                <EmptyDescription>
                  Você não tem permissão para consultar métricas agregadas deste
                  workspace, então esta área mostra apenas o explorer de logs.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}

      {canReadMetrics ? (
        <section className="grid gap-4">
          <Card className="bg-card/85 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="secondary">Drilldown ativo</Badge>
                  <CardTitle className="text-2xl tracking-tight text-foreground">
                    {drilldown?.entity.name ??
                      activeDefinition?.name ??
                      "Selecione uma entidade"}
                  </CardTitle>
                  <CardDescription className="leading-7">
                    {drilldown?.entity.description ??
                      activeDefinition?.description ??
                      "Abra um drilldown acima para ver métricas detalhadas da entidade escolhida."}
                  </CardDescription>
                </div>
                {activeDefinition ? (
                  <Badge variant="outline">
                    {getObservabilityDrilldownDomainLabel(
                      activeDefinition.domain,
                    )}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              {isLoadingDrilldown ? (
                <div className="flex min-h-52 items-center justify-center gap-3 rounded-[1.5rem] border border-border/70 bg-background/70">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Carregando o drilldown selecionado...
                  </span>
                </div>
              ) : drilldownError ? (
                <Empty className="border border-border/70 bg-background/70">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <AlertTriangle className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>
                      Não foi possível abrir esse drilldown
                    </EmptyTitle>
                    <EmptyDescription>{drilldownError}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : !drilldown ? (
                <Empty className="border border-border/70 bg-background/70">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Radar className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum drilldown aberto</EmptyTitle>
                    <EmptyDescription>
                      Escolha uma entidade acima para inspecionar tráfego,
                      métricas e erros relacionados a ela.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="bg-background/70">
                      <CardHeader>
                        <Badge variant="outline" className="w-fit">
                          Entidade
                        </Badge>
                        <CardTitle className="text-xl tracking-tight text-foreground">
                          {drilldown.entity.name}
                        </CardTitle>
                        <CardDescription className="leading-7">
                          {drilldown.entity.description ??
                            "Sem descrição adicional para esta entidade."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                            Janela analisada
                          </p>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {formatDateTime(drilldown.window_start)} até{" "}
                            {formatDateTime(drilldown.window_end)}
                          </p>
                        </div>
                        {drilldown.entity.metadata ? (
                          <div className="grid gap-3">
                            {Object.entries(drilldown.entity.metadata).map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                  className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
                                >
                                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                                    {key.replaceAll("_", " ")}
                                  </p>
                                  <p
                                    className={cn(
                                      "mt-2 text-sm leading-6 text-foreground",
                                      typeof value === "string"
                                        ? "break-all"
                                        : undefined,
                                    )}
                                  >
                                    {formatMetadataValue(value)}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                      <DrilldownSummaryCard
                        label="Requisições"
                        value={formatRequestCount(
                          drilldown.request_summary.total_requests,
                        )}
                        description="Volume total associado à entidade no recorte."
                        icon={Activity}
                      />
                      <DrilldownSummaryCard
                        label="Erros"
                        value={formatRequestCount(
                          drilldown.request_summary.error_requests,
                        )}
                        description="Falhas HTTP acumuladas para essa entidade."
                        icon={ShieldAlert}
                      />
                      <DrilldownSummaryCard
                        label="Taxa de erro"
                        value={formatPercentage(
                          drilldown.request_summary.error_rate,
                        )}
                        description="Percentual de erros em relação ao tráfego total."
                        icon={Radar}
                      />
                      <DrilldownSummaryCard
                        label="Latência média"
                        value={formatDuration(
                          drilldown.request_summary.average_duration_ms,
                        )}
                        description="Tempo médio de resposta nesse drilldown."
                        icon={Gauge}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {drilldown.sections.map((section) => (
                      <DrilldownInsightGroupCard
                        key={section.code}
                        group={section}
                      />
                    ))}
                  </div>

                  <Card className="bg-card/85 shadow-sm">
                    <CardHeader>
                      <Badge variant="secondary" className="w-fit">
                        Erros recentes
                      </Badge>
                      <CardTitle className="text-xl tracking-tight text-foreground">
                        Incidentes associados à entidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RecentErrorsList errors={drilldown.recent_errors} />
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <ObservabilityExplorer
        hours={selectedHours}
        canReadLogs={canReadAuditLogs}
        canReadMetrics={canReadMetrics}
      />
    </div>
  );
}
