"use client";

import {
  CheckCircle2,
  Loader2,
  MessageCircleMore,
  RadioTower,
  RefreshCcw,
  Send,
  Smartphone,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  createWhatsAppSender,
  getMessages,
  getProviderAccounts,
  getWhatsAppSenders,
  provisionTwilioSubaccount,
  provisionTwilioWhatsAppSender,
  syncTwilioWhatsAppSender,
  verifyTwilioWhatsAppSender,
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
  ProviderAccountItem,
  WhatsAppSenderItem,
} from "@/lib/messaging/types";
import { formatDateTime, formatRequestCount } from "@/lib/observability/format";
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

export function MessagingWorkspace() {
  const searchParams = useSearchParams();
  const { tenant } = useAuth();
  const { hasTenantPermission, status: accessStatus } = useAccess();

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
  const [isProvisioningProvider, setIsProvisioningProvider] = useState(false);
  const [isCreatingSender, setIsCreatingSender] = useState(false);
  const [pendingSenderId, setPendingSenderId] = useState<string | null>(null);
  const [providerFriendlyName, setProviderFriendlyName] = useState("");
  const [providerApiKeyFriendlyName, setProviderApiKeyFriendlyName] =
    useState("");
  const [senderProviderAccountId, setSenderProviderAccountId] = useState("");
  const [senderPhoneNumber, setSenderPhoneNumber] = useState("");
  const [senderDisplayName, setSenderDisplayName] = useState("");
  const [senderIdentifier, setSenderIdentifier] = useState("");
  const [senderIsDefault, setSenderIsDefault] = useState(false);
  const [profileNamesBySenderId, setProfileNamesBySenderId] = useState<
    Record<string, string>
  >({});
  const [verificationCodesBySenderId, setVerificationCodesBySenderId] =
    useState<Record<string, string>>({});
  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const isProviderSetupFlow = searchParams.get("setup") === "provider";

  const activeSendersCount = senders.filter(
    (sender) => sender.status === "active",
  ).length;
  const providerAccountMap = useMemo(
    () => new Map(providerAccounts.map((account) => [account.id, account])),
    [providerAccounts],
  );

  const replaceSender = useCallback((updatedSender: WhatsAppSenderItem) => {
    setSenders((currentSenders) =>
      currentSenders.map((sender) =>
        sender.id === updatedSender.id ? updatedSender : sender,
      ),
    );
  }, []);

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
      const [nextProviderAccounts, nextSenders] = await Promise.all([
        canReadProviderAccounts ? getProviderAccounts() : Promise.resolve([]),
        canReadSenders ? getWhatsAppSenders() : Promise.resolve([]),
      ]);

      setProviderAccounts(nextProviderAccounts);
      setSenders(nextSenders);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle:
          "Não foi possível carregar as integrações de mensageria agora.",
      });
      setProviderError(presentation.title);
      setSenderError(presentation.title);
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

    setProviderFriendlyName((currentValue) => currentValue || tenant.name);
    setProviderApiKeyFriendlyName(
      (currentValue) => currentValue || `${tenant.name} API Key`,
    );
  }, [providerAccounts.length, tenant?.name]);

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    void loadMessages();
  }, [accessStatus, loadMessages]);

  async function handleProvisionProvider(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsProvisioningProvider(true);

    try {
      const account = await provisionTwilioSubaccount({
        friendly_name: providerFriendlyName.trim() || undefined,
        api_key_friendly_name: providerApiKeyFriendlyName.trim() || undefined,
      });

      setProviderAccounts((currentAccounts) => [...currentAccounts, account]);
      setSenderProviderAccountId((currentValue) => currentValue || account.id);
      setProviderFriendlyName("");
      setProviderApiKeyFriendlyName("");
      toast.success("Subaccount Twilio provisionada com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle:
          "Não foi possível provisionar a subaccount Twilio agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsProvisioningProvider(false);
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

  async function handleProvisionSender(sender: WhatsAppSenderItem) {
    const profileName =
      profileNamesBySenderId[sender.id]?.trim() || sender.display_name?.trim();

    if (!profileName) {
      toast.error("Informe um nome de perfil para provisionar o sender.");
      return;
    }

    setPendingSenderId(sender.id);

    try {
      const updatedSender = await provisionTwilioWhatsAppSender(sender.id, {
        profile_name: profileName,
      });
      replaceSender(updatedSender);
      setProfileNamesBySenderId((currentValue) => ({
        ...currentValue,
        [sender.id]: profileName,
      }));
      toast.success("Sender provisionado na Twilio com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível provisionar esse sender na Twilio.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingSenderId(null);
    }
  }

  async function handleVerifySender(senderId: string) {
    const verificationCode = verificationCodesBySenderId[senderId]?.trim();

    if (!verificationCode) {
      toast.error("Informe o código de verificação recebido no telefone.");
      return;
    }

    setPendingSenderId(senderId);

    try {
      const updatedSender = await verifyTwilioWhatsAppSender(senderId, {
        verification_code: verificationCode,
      });
      replaceSender(updatedSender);
      setVerificationCodesBySenderId((currentValue) => ({
        ...currentValue,
        [senderId]: "",
      }));
      toast.success("Sender verificado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível verificar esse sender agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingSenderId(null);
    }
  }

  async function handleSyncSender(senderId: string) {
    setPendingSenderId(senderId);

    try {
      const updatedSender = await syncTwilioWhatsAppSender(senderId);
      replaceSender(updatedSender);
      toast.success("Status do sender sincronizado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível sincronizar esse sender agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingSenderId(null);
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
      {isProviderSetupFlow &&
      providerAccounts.length === 0 &&
      canManageProviderAccounts ? (
        <Card className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-5">
            <Badge variant="secondary" className="w-fit">
              Próximo passo do onboarding
            </Badge>
            <div className="space-y-2">
              <p className="font-serif text-3xl tracking-tight text-foreground">
                Conecte a subaccount Twilio do workspace
              </p>
              <p className="text-sm leading-7 text-muted-foreground">
                A criação de times pode ficar para depois. O próximo passo
                recomendado é provisionar a conta do provedor com o mesmo nome
                do workspace para habilitar o motor de WhatsApp.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Contas Twilio"
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
                      Crie a subaccount Twilio do workspace para começar o
                      onboarding dos senders.
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
                        <Badge variant="outline">{account.provider}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canManageProviderAccounts ? (
                <form
                  className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-background/70 p-4"
                  onSubmit={(event) => {
                    void handleProvisionProvider(event);
                  }}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Provisionar subaccount Twilio
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      O backend cria a subaccount, gera a API key e vincula a
                      conta ao workspace.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel>Nome amigável</FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerFriendlyName}
                        onChange={(event) => {
                          setProviderFriendlyName(event.target.value);
                        }}
                        placeholder="Ex.: BasixDigital Workspace"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Nome da API key</FieldLabel>
                    <FieldContent>
                      <Input
                        value={providerApiKeyFriendlyName}
                        onChange={(event) => {
                          setProviderApiKeyFriendlyName(event.target.value);
                        }}
                        placeholder="Ex.: BasixDigital Workspace API Key"
                      />
                      <FieldDescription>
                        Opcional. Se vazio, o backend gera um nome com base no
                        workspace.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Button type="submit" disabled={isProvisioningProvider}>
                    {isProvisioningProvider ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RadioTower className="size-4" />
                    )}
                    Provisionar subaccount
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
                    const profileName =
                      profileNamesBySenderId[sender.id] ??
                      sender.display_name ??
                      "";
                    const verificationCode =
                      verificationCodesBySenderId[sender.id] ?? "";

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
                            {canManageSenders ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={pendingSenderId === sender.id}
                                  onClick={() => {
                                    void handleSyncSender(sender.id);
                                  }}
                                >
                                  {pendingSenderId === sender.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="size-4" />
                                  )}
                                  Sincronizar
                                </Button>
                              </div>
                            ) : null}
                          </div>

                          {canManageSenders && !sender.sender_sid ? (
                            <div className="grid gap-3 rounded-[1.2rem] border border-border/70 bg-card/60 p-4">
                              <Field>
                                <FieldLabel>
                                  Nome do perfil na Twilio
                                </FieldLabel>
                                <FieldContent>
                                  <Input
                                    value={profileName}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setProfileNamesBySenderId(
                                        (currentValue) => ({
                                          ...currentValue,
                                          [sender.id]: value,
                                        }),
                                      );
                                    }}
                                    placeholder="Ex.: Basix Operação"
                                  />
                                </FieldContent>
                              </Field>
                              <Button
                                type="button"
                                disabled={pendingSenderId === sender.id}
                                onClick={() => {
                                  void handleProvisionSender(sender);
                                }}
                              >
                                {pendingSenderId === sender.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-4" />
                                )}
                                Provisionar na Twilio
                              </Button>
                            </div>
                          ) : null}

                          {canManageSenders &&
                          sender.status === "pending_verification" ? (
                            <div className="grid gap-3 rounded-[1.2rem] border border-border/70 bg-card/60 p-4">
                              <Field>
                                <FieldLabel>Código de verificação</FieldLabel>
                                <FieldContent>
                                  <Input
                                    value={verificationCode}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      setVerificationCodesBySenderId(
                                        (currentValue) => ({
                                          ...currentValue,
                                          [sender.id]: value,
                                        }),
                                      );
                                    }}
                                    placeholder="Ex.: 123456"
                                  />
                                  <FieldDescription>
                                    Use o código recebido no telefone para
                                    concluir o onboarding do sender.
                                  </FieldDescription>
                                </FieldContent>
                              </Field>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={pendingSenderId === sender.id}
                                onClick={() => {
                                  void handleVerifySender(sender.id);
                                }}
                              >
                                {pendingSenderId === sender.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="size-4" />
                                )}
                                Verificar sender
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {canManageSenders ? (
                <form
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
                      Crie o registro local do número antes de provisionar o
                      sender na Twilio.
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

                  <Field orientation="horizontal">
                    <Checkbox
                      checked={senderIsDefault}
                      onCheckedChange={(checked) => {
                        setSenderIsDefault(Boolean(checked));
                      }}
                    />
                    <FieldContent>
                      <FieldLabel>Definir como sender padrão</FieldLabel>
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
                      <TableRow key={message.id}>
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
    </div>
  );
}
