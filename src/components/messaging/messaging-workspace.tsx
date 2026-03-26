"use client";

import {
  AlertTriangle,
  Eye,
  Loader2,
  MessageCircleMore,
  RadioTower,
  Send,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { useProviderSetup } from "@/components/messaging/provider-setup-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  createProviderAccount,
  createWhatsAppSender,
  getMessages,
  getMessagingProviders,
  getProviderAccounts,
  getWhatsAppSenders,
} from "@/lib/messaging/api";
import {
  getMessageChannelLabel,
  getMessageCounterpartyLabel,
  getMessageDirectionLabel,
  getProviderAccountDisplayName,
  getProviderStatusLabel,
  getSenderDisplayName,
  getSenderStatusLabel,
} from "@/lib/messaging/format";
import type {
  MessageItem,
  MessagingProviderFieldItem,
  MessagingProviderItem,
  ProviderAccountItem,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";
import {
  getMessagingProviderAccountDrilldown,
  getMessagingSenderDrilldown,
} from "@/lib/observability/api";
import {
  formatDateTime,
  formatDuration,
  formatPercentage,
  formatRequestCount,
} from "@/lib/observability/format";
import type { ObservabilityDrilldownItem } from "@/lib/observability/types";
import {
  TENANT_MESSAGES_READ_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  TENANT_WHATSAPP_SENDERS_MANAGE_PERMISSION,
  TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
} from "@/lib/rbac/permissions";

const CHANNEL_FILTERS = [
  { label: "Todos", value: "" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
  { label: "E-mail", value: "email" },
] as const;

const DIRECTION_FILTERS = [
  { label: "Tudo", value: "" },
  { label: "Entrada", value: "inbound" },
  { label: "Saída", value: "outbound" },
] as const;

const STATUS_FILTERS = [
  { label: "Todos", value: "" },
  { label: "Enviado", value: "sent" },
  { label: "Recebido", value: "received" },
  { label: "Entregue", value: "delivered" },
  { label: "Lido", value: "read" },
  { label: "Falha", value: "failed" },
] as const;

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof MessageCircleMore;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="grid gap-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{label}</Badge>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
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
  );
}

function getProviderBadgeVariant(status: string) {
  if (status === "active") {
    return "secondary" as const;
  }

  if (status === "error") {
    return "destructive" as const;
  }

  return "outline" as const;
}

function getMessageStatusVariant(status: string) {
  if (["failed", "undelivered", "error"].includes(status)) {
    return "destructive" as const;
  }

  if (["delivered", "read", "received", "sent"].includes(status)) {
    return "secondary" as const;
  }

  return "outline" as const;
}

function RecentErrorsList({
  errors,
}: {
  errors: ObservabilityDrilldownItem["recent_errors"];
}) {
  if (errors.length === 0) {
    return (
      <Empty className="border border-border/70 bg-background/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertTriangle className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Nenhum erro recente</EmptyTitle>
          <EmptyDescription>
            Não houve falhas recentes para essa entidade no recorte selecionado.
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
  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "number") {
    return formatRequestCount(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "Não informado";
  }

  return JSON.stringify(value);
}

function DrilldownDialog({
  open,
  onOpenChange,
  title,
  description,
  drilldown,
  errorMessage,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  drilldown: ObservabilityDrilldownItem | null;
  errorMessage: string | null;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-[2rem] p-0 sm:max-w-4xl">
        <div className="grid gap-6 p-6">
          <DialogHeader className="gap-3">
            <Badge variant="secondary" className="w-fit">
              Drilldown operacional
            </Badge>
            <DialogTitle className="font-serif text-3xl tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="leading-7">
              {description}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando detalhes operacionais...
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : drilldown ? (
            <div className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Requisições"
                  value={formatRequestCount(
                    drilldown.request_summary.total_requests,
                  )}
                  description="Chamadas da API relacionadas a esta entidade no recorte."
                  icon={RadioTower}
                />
                <MetricCard
                  label="Erros"
                  value={formatRequestCount(
                    drilldown.request_summary.error_requests,
                  )}
                  description="Falhas registradas para a entidade no mesmo período."
                  icon={AlertTriangle}
                />
                <MetricCard
                  label="Taxa de erro"
                  value={formatPercentage(drilldown.request_summary.error_rate)}
                  description="Relação entre falhas e total de requisições."
                  icon={Send}
                />
                <MetricCard
                  label="Duração média"
                  value={formatDuration(
                    drilldown.request_summary.average_duration_ms,
                  )}
                  description="Tempo médio de resposta das rotas afetadas."
                  icon={Send}
                />
              </div>

              <Card className="bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl tracking-tight text-foreground">
                    Contexto da entidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {drilldown.entity.name}
                    </p>
                    {drilldown.entity.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">
                        {drilldown.entity.description}
                      </p>
                    ) : null}
                  </div>

                  {drilldown.entity.metadata ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(drilldown.entity.metadata).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
                          >
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              {key}
                            </p>
                            <p
                              className="mt-1 text-sm font-medium text-foreground"
                              title={formatMetadataValue(value)}
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

              <div className="grid gap-6 xl:grid-cols-2">
                {drilldown.sections.map((section) => (
                  <Card key={section.code} className="bg-card/85 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg tracking-tight text-foreground">
                        {section.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      {section.metrics.map((metric) => (
                        <div
                          key={metric.key}
                          className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {metric.label}
                            </p>
                            {metric.description ? (
                              <p className="text-sm leading-6 text-muted-foreground">
                                {metric.description}
                              </p>
                            ) : null}
                            <p className="font-serif text-3xl tracking-tight text-foreground">
                              {typeof metric.value === "number"
                                ? formatRequestCount(metric.value)
                                : metric.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-card/85 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl tracking-tight text-foreground">
                    Erros recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecentErrorsList errors={drilldown.recent_errors} />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageDetailDialog({
  message,
  open,
  onOpenChange,
}: {
  message: MessageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!message) {
    return null;
  }

  const referenceDate =
    message.received_at ?? message.sent_at ?? message.created_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-[2rem] p-0 sm:max-w-3xl">
        <div className="grid gap-6 p-6">
          <DialogHeader className="gap-3">
            <Badge variant="secondary" className="w-fit">
              Mensagem
            </Badge>
            <DialogTitle className="font-serif text-3xl tracking-tight text-foreground">
              {getMessageChannelLabel(message.channel)} ·{" "}
              {getMessageDirectionLabel(message.direction)}
            </DialogTitle>
            <DialogDescription className="leading-7">
              Visualize o conteúdo, o status e o contexto bruto dessa mensagem.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Contato
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getMessageCounterpartyLabel(message)}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Status
              </p>
              <div className="mt-2">
                <Badge variant={getMessageStatusVariant(message.status)}>
                  {message.status}
                </Badge>
              </div>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Data de referência
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDateTime(referenceDate)}
              </p>
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Provider
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {message.provider}
              </p>
            </div>
          </div>

          {message.subject ? (
            <Card className="bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg tracking-tight text-foreground">
                  Assunto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-foreground">
                  {message.subject}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {message.body_text ? (
            <Card className="bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg tracking-tight text-foreground">
                  Conteúdo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-[1.2rem] bg-background/85 p-4 text-sm leading-7 text-foreground">
                  {message.body_text}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          {message.error_detail ? (
            <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {message.error_detail}
            </div>
          ) : null}

          {message.payload ? (
            <Card className="bg-card/85 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg tracking-tight text-foreground">
                  Payload bruto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-[1.2rem] bg-background/85 p-4 text-xs leading-6 text-foreground">
                  {JSON.stringify(message.payload, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MessagingWorkspace() {
  const { tenant } = useAuth();
  const { hasTenantPermission, status: accessStatus } = useAccess();
  const { refresh: refreshProviderSetup } = useProviderSetup();

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
  const canReadMessages = hasTenantPermission(TENANT_MESSAGES_READ_PERMISSION);

  const [availableProviders, setAvailableProviders] = useState<
    MessagingProviderItem[]
  >([]);
  const [providerAccounts, setProviderAccounts] = useState<
    ProviderAccountItem[]
  >([]);
  const [senders, setSenders] = useState<WhatsAppSenderItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [senderError, setSenderError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [isCreatingSender, setIsCreatingSender] = useState(false);
  const [selectedProviderCode, setSelectedProviderCode] = useState("meta");
  const [providerAccountName, setProviderAccountName] = useState("");
  const [providerAccountSid, setProviderAccountSid] = useState("");
  const [providerAccountApiKeySid, setProviderAccountApiKeySid] = useState("");
  const [providerAccountSecretRef, setProviderAccountSecretRef] = useState("");
  const [senderProviderAccountId, setSenderProviderAccountId] = useState("");
  const [senderPhoneNumber, setSenderPhoneNumber] = useState("");
  const [senderDisplayName, setSenderDisplayName] = useState("");
  const [senderIdentifier, setSenderIdentifier] = useState("");
  const [senderIsDefault, setSenderIsDefault] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedProviderAccount, setSelectedProviderAccount] =
    useState<ProviderAccountItem | null>(null);
  const [selectedSender, setSelectedSender] =
    useState<WhatsAppSenderItem | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(
    null,
  );
  const [providerDrilldown, setProviderDrilldown] =
    useState<ObservabilityDrilldownItem | null>(null);
  const [senderDrilldown, setSenderDrilldown] =
    useState<ObservabilityDrilldownItem | null>(null);
  const [providerDrilldownError, setProviderDrilldownError] = useState<
    string | null
  >(null);
  const [senderDrilldownError, setSenderDrilldownError] = useState<
    string | null
  >(null);
  const [isLoadingProviderDrilldown, setIsLoadingProviderDrilldown] =
    useState(false);
  const [isLoadingSenderDrilldown, setIsLoadingSenderDrilldown] =
    useState(false);
  const activeSendersCount = senders.filter(
    (sender) => sender.status === "active",
  ).length;
  const providerAccountMap = useMemo(
    () => new Map(providerAccounts.map((account) => [account.id, account])),
    [providerAccounts],
  );
  const selectedProvider = useMemo(
    () =>
      availableProviders.find(
        (provider) => provider.code === selectedProviderCode,
      ) ??
      availableProviders[0] ??
      null,
    [availableProviders, selectedProviderCode],
  );

  function getProviderField(key: string): MessagingProviderFieldItem | null {
    return (
      selectedProvider?.provider_account_fields.find(
        (field) => field.key === key,
      ) ?? null
    );
  }

  const loadMessages = useCallback(async () => {
    if (!canReadMessages) {
      setMessages([]);
      setMessageError(null);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    setMessageError(null);

    try {
      const nextMessages = await getMessages({
        channel: selectedChannel || undefined,
        direction: selectedDirection || undefined,
        status: selectedStatus || undefined,
      });
      setMessages(nextMessages);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar o histórico de mensagens.",
      });
      setMessageError(presentation.title);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [canReadMessages, selectedChannel, selectedDirection, selectedStatus]);

  const loadWorkspaceData = useCallback(async () => {
    if (
      !canReadProviderAccounts &&
      !canManageProviderAccounts &&
      !canReadSenders &&
      !canManageSenders &&
      !canReadMessages
    ) {
      setProviderAccounts([]);
      setAvailableProviders([]);
      setSenders([]);
      setMessages([]);
      setProviderError(null);
      setSenderError(null);
      setMessageError(null);
      setIsLoadingWorkspace(false);
      return;
    }

    setIsLoadingWorkspace(true);
    setProviderError(null);
    setSenderError(null);

    try {
      const [nextProviders, nextProviderAccounts, nextSenders] =
        await Promise.all([
          getMessagingProviders(),
          canReadProviderAccounts ? getProviderAccounts() : Promise.resolve([]),
          canReadSenders ? getWhatsAppSenders() : Promise.resolve([]),
        ]);

      setAvailableProviders(nextProviders);
      setSelectedProviderCode(
        (currentValue) => currentValue || nextProviders[0]?.code || "meta",
      );
      setProviderAccounts(nextProviderAccounts);
      setSenders(nextSenders);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle:
          "Não foi possível carregar as integrações de mensageria agora.",
      });
      setProviderError(presentation.title);
      setSenderError(presentation.title);
      setAvailableProviders([]);
      setProviderAccounts([]);
      setSenders([]);
    } finally {
      setIsLoadingWorkspace(false);
    }
  }, [
    canManageProviderAccounts,
    canManageSenders,
    canReadMessages,
    canReadProviderAccounts,
    canReadSenders,
  ]);

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    void loadWorkspaceData();
  }, [accessStatus, loadWorkspaceData]);

  useEffect(() => {
    if (!senderProviderAccountId && providerAccounts.length > 0) {
      setSenderProviderAccountId(providerAccounts[0]?.id ?? "");
    }
  }, [providerAccounts, senderProviderAccountId]);

  useEffect(() => {
    if (providerAccounts.length > 0 || !tenant?.name) {
      return;
    }

    setProviderAccountName((currentValue) => currentValue || tenant.name);
  }, [providerAccounts.length, tenant?.name]);

  useEffect(() => {
    if (availableProviders.length === 0) {
      return;
    }

    setSelectedProviderCode((currentValue) => {
      if (
        currentValue &&
        availableProviders.some((provider) => provider.code === currentValue)
      ) {
        return currentValue;
      }

      return availableProviders[0]?.code ?? "meta";
    });
  }, [availableProviders]);

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    void loadMessages();
  }, [accessStatus, loadMessages]);

  async function handleCreateProvider(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!providerAccountSid.trim()) {
      toast.error(
        `Informe ${getProviderField("account_sid")?.label ?? "o Account SID do provider"}.`,
      );
      return;
    }

    setIsCreatingProvider(true);

    try {
      const nextProviderAccount = await createProviderAccount({
        provider: selectedProviderCode,
        account_sid: providerAccountSid.trim(),
        api_key_sid: providerAccountApiKeySid.trim() || undefined,
        secret_ref: providerAccountSecretRef.trim() || undefined,
        configuration: providerAccountName.trim()
          ? {
              friendly_name: providerAccountName.trim(),
            }
          : undefined,
      });

      const accounts = canReadProviderAccounts
        ? await getProviderAccounts()
        : [nextProviderAccount, ...providerAccounts];

      setProviderAccounts(accounts);
      setSenderProviderAccountId(
        (currentValue) => (currentValue || accounts[0]?.id) ?? "",
      );
      setProviderAccountSid("");
      setProviderAccountApiKeySid("");
      setProviderAccountSecretRef("");
      await refreshProviderSetup();
      toast.success("Provider conectado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível conectar o provider agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingProvider(false);
    }
  }

  async function handleCreateSender(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!senderProviderAccountId) {
      toast.error("Selecione uma conta de provedor para criar o sender.");
      return;
    }

    if (!senderPhoneNumber.trim()) {
      toast.error("Informe um número de telefone para o sender.");
      return;
    }

    setIsCreatingSender(true);

    try {
      const sender = await createWhatsAppSender({
        provider_account_id: senderProviderAccountId,
        phone_number: senderPhoneNumber.trim(),
        display_name: senderDisplayName.trim() || undefined,
        sender_id: senderIdentifier.trim() || undefined,
        is_default: senderIsDefault,
      });

      if (canReadSenders) {
        setSenders(await getWhatsAppSenders());
      } else {
        setSenders((currentSenders) => [sender, ...currentSenders]);
      }
      await refreshProviderSetup();
      setSenderPhoneNumber("");
      setSenderDisplayName("");
      setSenderIdentifier("");
      setSenderIsDefault(false);
      toast.success("Sender do WhatsApp criado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível criar o sender do WhatsApp agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingSender(false);
    }
  }

  async function handleOpenProviderDetails(account: ProviderAccountItem) {
    setSelectedProviderAccount(account);
    setProviderDrilldown(null);
    setProviderDrilldownError(null);
    setIsLoadingProviderDrilldown(true);

    try {
      const nextDrilldown = await getMessagingProviderAccountDrilldown(
        account.id,
        { hours: 24 },
      );
      setProviderDrilldown(nextDrilldown);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle:
          "Não foi possível carregar os detalhes dessa conta de provedor.",
      });
      setProviderDrilldownError(
        presentation.description
          ? `${presentation.title} ${presentation.description}`
          : presentation.title,
      );
    } finally {
      setIsLoadingProviderDrilldown(false);
    }
  }

  async function handleOpenSenderDetails(sender: WhatsAppSenderItem) {
    setSelectedSender(sender);
    setSenderDrilldown(null);
    setSenderDrilldownError(null);
    setIsLoadingSenderDrilldown(true);

    try {
      const nextDrilldown = await getMessagingSenderDrilldown(sender.id, {
        hours: 24,
      });
      setSenderDrilldown(nextDrilldown);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle:
          "Não foi possível carregar os detalhes desse sender agora.",
      });
      setSenderDrilldownError(
        presentation.description
          ? `${presentation.title} ${presentation.description}`
          : presentation.title,
      );
    } finally {
      setIsLoadingSenderDrilldown(false);
    }
  }

  if (accessStatus === "loading" || isLoadingWorkspace) {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-72 items-center justify-center pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando operação de mensageria...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (
    !canReadProviderAccounts &&
    !canManageProviderAccounts &&
    !canReadSenders &&
    !canManageSenders &&
    !canReadMessages
  ) {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircleMore className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Sem acesso à mensageria</EmptyTitle>
              <EmptyDescription>
                Você precisa de permissões de mensagens, contas do provedor ou
                senders para visualizar esta área.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {canManageProviderAccounts || canManageSenders ? (
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-4 pt-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">
                Próximo passo da mensageria
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {providerAccounts.length === 0
                  ? "Conecte um provider de mensageria no workspace para habilitar a base da operação de WhatsApp."
                  : senders.length === 0
                    ? "O provider já está conectado. Agora cadastre o primeiro sender do WhatsApp."
                    : "A integração principal já está pronta. Você pode revisar contas, senders e histórico normalmente."}
              </p>
            </div>
            {providerAccounts.length === 0 && canManageProviderAccounts ? (
              <Button
                type="button"
                onClick={() => {
                  document
                    .getElementById("provider-account-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <RadioTower className="size-4" />
                Conectar provider
              </Button>
            ) : null}
            {providerAccounts.length > 0 &&
            senders.length === 0 &&
            canManageSenders ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  document
                    .getElementById("sender-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Smartphone className="size-4" />
                Cadastrar sender
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Contas do provedor"
          value={String(providerAccounts.length)}
          description="Conexões gerenciadas do workspace com o provedor."
          icon={RadioTower}
        />
        <MetricCard
          label="Senders WhatsApp"
          value={String(activeSendersCount)}
          description="Senders ativos prontos para receber e enviar mensagens."
          icon={Smartphone}
        />
        <MetricCard
          label="Mensagens"
          value={formatRequestCount(messages.length)}
          description="Histórico do recorte atual com filtros aplicados."
          icon={Send}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="grid gap-6">
          <Card className="bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight text-foreground">
                Contas do provedor
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {providerError ? (
                <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {providerError}
                </div>
              ) : null}

              {!canReadProviderAccounts ? (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Você não pode visualizar as contas do provedor deste
                  workspace.
                </div>
              ) : providerAccounts.length === 0 ? (
                <Empty className="border border-dashed border-border/70 bg-background/70">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <RadioTower className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma conta conectada</EmptyTitle>
                    <EmptyDescription>
                      Conecte o primeiro provider de mensageria do workspace
                      para começar o onboarding dos senders.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3">
                  {providerAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-foreground">
                              {getProviderAccountDisplayName(account)}
                            </p>
                            <Badge
                              variant={getProviderBadgeVariant(account.status)}
                            >
                              {getProviderStatusLabel(account.status)}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Conta: {account.account_sid}</p>
                            <p>Modo: {account.mode}</p>
                            {account.api_key_sid ? (
                              <p>API Key: {account.api_key_sid}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{account.provider}</Badge>
                          {canReadProviderAccounts ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                void handleOpenProviderDetails(account);
                              }}
                            >
                              <Eye className="size-4" />
                              Ver detalhes
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canManageProviderAccounts ? (
                <form
                  id="provider-account-form"
                  className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4"
                  onSubmit={(event) => {
                    void handleCreateProvider(event);
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Conectar provider de mensageria
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Escolha o provider e cadastre os identificadores
                      operacionais usados por este workspace.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel>Provider</FieldLabel>
                    <FieldContent>
                      <select
                        value={selectedProviderCode}
                        onChange={(event) => {
                          setSelectedProviderCode(event.target.value);
                        }}
                        className="h-8 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {availableProviders.map((provider) => (
                          <option key={provider.code} value={provider.code}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Nome da conta</FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerAccountName}
                        onChange={(event) => {
                          setProviderAccountName(event.target.value);
                        }}
                        placeholder="Ex.: BasixDigital Meta"
                      />
                      <FieldDescription>
                        Opcional. Usado como nome amigável interno no workspace.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {getProviderField("account_sid")?.label ?? "Account SID"}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerAccountSid}
                        onChange={(event) => {
                          setProviderAccountSid(event.target.value);
                        }}
                        placeholder={
                          getProviderField("account_sid")?.placeholder ??
                          "Ex.: acct_provider_workspace"
                        }
                      />
                      {getProviderField("account_sid")?.description ? (
                        <FieldDescription>
                          {getProviderField("account_sid")?.description}
                        </FieldDescription>
                      ) : null}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {getProviderField("api_key_sid")?.label ?? "API Key SID"}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerAccountApiKeySid}
                        onChange={(event) => {
                          setProviderAccountApiKeySid(event.target.value);
                        }}
                        placeholder={
                          getProviderField("api_key_sid")?.placeholder ??
                          "Opcional"
                        }
                      />
                      {getProviderField("api_key_sid")?.description ? (
                        <FieldDescription>
                          {getProviderField("api_key_sid")?.description}
                        </FieldDescription>
                      ) : null}
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>
                      {getProviderField("secret_ref")?.label ?? "Secret Ref"}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerAccountSecretRef}
                        onChange={(event) => {
                          setProviderAccountSecretRef(event.target.value);
                        }}
                        placeholder={
                          getProviderField("secret_ref")?.placeholder ??
                          "Ex.: infisical/provider/workspace"
                        }
                      />
                      <FieldDescription>
                        {getProviderField("secret_ref")?.description ??
                          "Opcional. Referência do segredo armazenado fora da aplicação."}
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Button type="submit" disabled={isCreatingProvider}>
                    {isCreatingProvider ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RadioTower className="size-4" />
                    )}
                    Conectar provider
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-tight text-foreground">
                Senders do WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {senderError ? (
                <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {senderError}
                </div>
              ) : null}

              {!canReadSenders ? (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Você não pode visualizar os senders do WhatsApp deste
                  workspace.
                </div>
              ) : senders.length === 0 ? (
                <Empty className="border border-dashed border-border/70 bg-background/70">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Smartphone className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum sender cadastrado</EmptyTitle>
                    <EmptyDescription>
                      Cadastre um número do WhatsApp para iniciar o onboarding e
                      receber as entradas do tenant correto.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-3">
                  {senders.map((sender) => {
                    const providerAccount = providerAccountMap.get(
                      sender.provider_account_id,
                    );

                    return (
                      <div
                        key={sender.id}
                        className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4"
                      >
                        <div className="grid gap-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {getSenderDisplayName(sender)}
                                </p>
                                <Badge
                                  variant={getProviderBadgeVariant(
                                    sender.status,
                                  )}
                                >
                                  {getSenderStatusLabel(sender.status)}
                                </Badge>
                                {sender.is_default ? (
                                  <Badge variant="secondary">Padrão</Badge>
                                ) : null}
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>Número: {sender.phone_number}</p>
                                {sender.sender_id ? (
                                  <p>Sender ID: {sender.sender_id}</p>
                                ) : null}
                                {providerAccount ? (
                                  <p>
                                    Conta:{" "}
                                    {getProviderAccountDisplayName(
                                      providerAccount,
                                    )}
                                  </p>
                                ) : null}
                                {sender.verified_at ? (
                                  <p>
                                    Verificado em{" "}
                                    {formatDateTime(sender.verified_at)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {canReadSenders ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    void handleOpenSenderDetails(sender);
                                  }}
                                >
                                  <Eye className="size-4" />
                                  Ver detalhes
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {canManageSenders ? (
                <form
                  id="sender-form"
                  className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4"
                  onSubmit={(event) => {
                    void handleCreateSender(event);
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Cadastrar sender do WhatsApp
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Cadastre um número do WhatsApp Business para receber e
                      enviar mensagens.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel>Conta do provedor</FieldLabel>
                    <FieldContent>
                      <select
                        value={senderProviderAccountId}
                        onChange={(event) => {
                          setSenderProviderAccountId(event.target.value);
                        }}
                        className="h-8 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Selecione uma conta</option>
                        {providerAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {getProviderAccountDisplayName(account)}
                          </option>
                        ))}
                      </select>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Número de telefone</FieldLabel>
                    <FieldContent>
                      <Input
                        value={senderPhoneNumber}
                        onChange={(event) => {
                          setSenderPhoneNumber(event.target.value);
                        }}
                        placeholder="+5511999999999"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Nome de exibição</FieldLabel>
                    <FieldContent>
                      <Input
                        value={senderDisplayName}
                        onChange={(event) => {
                          setSenderDisplayName(event.target.value);
                        }}
                        placeholder="Ex.: Basix Operação"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Sender ID</FieldLabel>
                    <FieldContent>
                      <Input
                        value={senderIdentifier}
                        onChange={(event) => {
                          setSenderIdentifier(event.target.value);
                        }}
                        placeholder="whatsapp:+5511999999999"
                      />
                      <FieldDescription>
                        Opcional. Se vazio, o backend usa o número informado.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Button
                    type="submit"
                    disabled={isCreatingSender || providerAccounts.length === 0}
                  >
                    {isCreatingSender ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Smartphone className="size-4" />
                    )}
                    Criar sender
                  </Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight text-foreground">
              Histórico de mensagens
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">Canal</p>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_FILTERS.map((filter) => (
                    <Button
                      key={filter.value || "all"}
                      type="button"
                      size="sm"
                      variant={
                        selectedChannel === filter.value
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => {
                        setSelectedChannel(filter.value);
                      }}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">Direção</p>
                <div className="flex flex-wrap gap-2">
                  {DIRECTION_FILTERS.map((filter) => (
                    <Button
                      key={filter.value || "all"}
                      type="button"
                      size="sm"
                      variant={
                        selectedDirection === filter.value
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => {
                        setSelectedDirection(filter.value);
                      }}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <p className="text-sm font-medium text-foreground">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((filter) => (
                    <Button
                      key={filter.value || "all"}
                      type="button"
                      size="sm"
                      variant={
                        selectedStatus === filter.value
                          ? "secondary"
                          : "outline"
                      }
                      onClick={() => {
                        setSelectedStatus(filter.value);
                      }}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {messageError ? (
              <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {messageError}
              </div>
            ) : null}

            {!canReadMessages ? (
              <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                Você não tem acesso ao histórico de mensagens deste workspace.
              </div>
            ) : isLoadingMessages ? (
              <div className="flex min-h-48 items-center justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Carregando mensagens...
                </div>
              </div>
            ) : messages.length === 0 ? (
              <Empty className="border border-dashed border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleMore className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma mensagem encontrada</EmptyTitle>
                  <EmptyDescription>
                    Ajuste os filtros ou aguarde novos eventos de mensageria do
                    workspace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => {
                    const referenceDate =
                      message.received_at ??
                      message.sent_at ??
                      message.created_at;

                    return (
                      <TableRow
                        key={message.id}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedMessage(message);
                        }}
                      >
                        <TableCell className="max-w-0">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium text-foreground">
                              {getMessageChannelLabel(message.channel)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {message.provider}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getMessageDirectionLabel(message.direction)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="min-w-0 space-y-1">
                            <p
                              className="truncate font-medium text-foreground"
                              title={getMessageCounterpartyLabel(message)}
                            >
                              {getMessageCounterpartyLabel(message)}
                            </p>
                            {message.subject ? (
                              <p
                                className="truncate text-xs text-muted-foreground"
                                title={message.subject}
                              >
                                {message.subject}
                              </p>
                            ) : message.body_text ? (
                              <p
                                className="truncate text-xs text-muted-foreground"
                                title={message.body_text}
                              >
                                {message.body_text}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getMessageStatusVariant(message.status)}
                          >
                            {message.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(referenceDate)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DrilldownDialog
        open={Boolean(selectedProviderAccount)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProviderAccount(null);
            setProviderDrilldown(null);
            setProviderDrilldownError(null);
          }
        }}
        title={
          selectedProviderAccount
            ? getProviderAccountDisplayName(selectedProviderAccount)
            : "Conta do provedor"
        }
        description="Veja volume, erros recentes e sinais operacionais da conta Meta conectada a este workspace."
        drilldown={providerDrilldown}
        errorMessage={providerDrilldownError}
        isLoading={isLoadingProviderDrilldown}
      />

      <DrilldownDialog
        open={Boolean(selectedSender)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSender(null);
            setSenderDrilldown(null);
            setSenderDrilldownError(null);
          }
        }}
        title={
          selectedSender
            ? getSenderDisplayName(selectedSender)
            : "Sender do WhatsApp"
        }
        description="Acompanhe atividade, erros e métricas operacionais específicas deste sender."
        drilldown={senderDrilldown}
        errorMessage={senderDrilldownError}
        isLoading={isLoadingSenderDrilldown}
      />

      <MessageDetailDialog
        open={Boolean(selectedMessage)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMessage(null);
          }
        }}
        message={selectedMessage}
      />
    </div>
  );
}
