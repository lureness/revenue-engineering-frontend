"use client";

import {
  BookUser,
  CheckCheck,
  Inbox,
  Loader2,
  Lock,
  Mail,
  MessageCircleReply,
  RefreshCcw,
  Search,
  SendHorizontal,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  assignInboxConversation,
  closeInboxConversation,
  getInboxConversationDetail,
  getInboxConversations,
  markInboxConversationAsRead,
  reopenInboxConversation,
  sendInboxConversationMessage,
} from "@/lib/inbox/api";
import {
  getInboxChannelLabel,
  getInboxConversationDisplayName,
  getInboxConversationPreview,
  getInboxConversationStatusLabel,
  getInboxMessageDirectionLabel,
  getInboxMessageTimestamp,
} from "@/lib/inbox/format";
import type {
  InboxConversationDetail,
  InboxConversationListItem,
} from "@/lib/inbox/types";
import { formatDateTime } from "@/lib/observability/format";
import { getTenantUsers } from "@/lib/rbac/api";
import {
  TENANT_COMPOSER_SEND_PERMISSION,
  TENANT_CONVERSATIONS_MANAGE_PERMISSION,
  TENANT_CONVERSATIONS_READ_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_TEAMS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import type { TenantUserItem } from "@/lib/rbac/types";
import { getTeams } from "@/lib/teams/api";
import type { TeamItem } from "@/lib/teams/types";
import { cn } from "@/lib/utils";

const STATUS_FILTER_OPTIONS = [
  { label: "Todas", value: "all" },
  { label: "Abertas", value: "open" },
  { label: "Encerradas", value: "closed" },
] as const;

const CHANNEL_FILTER_OPTIONS = [
  { label: "Todos", value: "all" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "SMS", value: "sms" },
  { label: "E-mail", value: "email" },
] as const;

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  description,
}: SelectFieldProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldContent>
        <select
          className="h-11 w-full rounded-[1rem] border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition focus:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-60"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FieldContent>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

function getConversationCounterCopy(total: number) {
  if (total === 1) {
    return "1 conversa em operação";
  }

  return `${total} conversas em operação`;
}

function getAssignedUserLabel(
  conversation: InboxConversationDetail,
  tenantUsers: TenantUserItem[],
) {
  if (!conversation.assigned_user_id) {
    return "Sem responsável definido";
  }

  const assignedUser = tenantUsers.find(
    (user) => user.id === conversation.assigned_user_id,
  );

  return assignedUser?.email ?? "Usuário atribuído";
}

function getAssignedTeamLabel(
  conversation: InboxConversationDetail,
  teams: TeamItem[],
) {
  if (!conversation.assigned_team_id) {
    return "Sem time atribuído";
  }

  const assignedTeam = teams.find(
    (team) => team.id === conversation.assigned_team_id,
  );

  return assignedTeam?.name ?? "Time atribuído";
}

export function InboxWorkspace() {
  const { hasTenantPermission, status: accessStatus } = useAccess();

  const [conversations, setConversations] = useState<
    InboxConversationListItem[]
  >([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedConversation, setSelectedConversation] =
    useState<InboxConversationDetail | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [hasUnreadOnly, setHasUnreadOnly] = useState(false);
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentTeamId, setAssignmentTeamId] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingConversationDetail, setIsLoadingConversationDetail] =
    useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [actionPending, setActionPending] = useState<
    "read" | "close" | "reopen" | null
  >(null);

  const canReadConversations = hasTenantPermission(
    TENANT_CONVERSATIONS_READ_PERMISSION,
  );
  const canManageConversations = hasTenantPermission(
    TENANT_CONVERSATIONS_MANAGE_PERMISSION,
  );
  const canSendComposer = hasTenantPermission(TENANT_COMPOSER_SEND_PERMISSION);
  const canReadMembers = hasTenantPermission(TENANT_MEMBERS_READ_PERMISSION);
  const canReadTeams = hasTenantPermission(TENANT_TEAMS_READ_PERMISSION);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (accumulator, conversation) => accumulator + conversation.unread_count,
        0,
      ),
    [conversations],
  );
  const totalClosed = useMemo(
    () =>
      conversations.filter((conversation) => conversation.status === "closed")
        .length,
    [conversations],
  );

  const loadConversations = useCallback(
    async (preferredConversationId?: string | null) => {
      if (!canReadConversations) {
        setConversations([]);
        setSelectedConversationId(null);
        setSelectedConversation(null);
        setWorkspaceError(null);
        setIsLoadingConversations(false);
        return;
      }

      setIsLoadingConversations(true);
      setWorkspaceError(null);

      try {
        const response = await getInboxConversations({
          status: statusFilter !== "all" ? statusFilter : undefined,
          channel: channelFilter !== "all" ? channelFilter : undefined,
          has_unread: hasUnreadOnly ? true : undefined,
          q: searchQuery || undefined,
          limit: 100,
        });

        setConversations(response.items);
        setSelectedConversationId((currentValue) => {
          const desiredConversationId = preferredConversationId ?? currentValue;

          if (
            desiredConversationId &&
            response.items.some(
              (conversation) => conversation.id === desiredConversationId,
            )
          ) {
            return desiredConversationId;
          }

          return response.items[0]?.id ?? null;
        });
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar as conversas agora.",
        });
        setWorkspaceError(presentation.title);
        setConversations([]);
        setSelectedConversationId(null);
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [
      canReadConversations,
      channelFilter,
      hasUnreadOnly,
      searchQuery,
      statusFilter,
    ],
  );

  const loadConversationDetail = useCallback(
    async (conversationId: string | null) => {
      if (!canReadConversations || !conversationId) {
        setSelectedConversation(null);
        setDetailError(null);
        setIsLoadingConversationDetail(false);
        return;
      }

      setIsLoadingConversationDetail(true);
      setDetailError(null);

      try {
        const detail = await getInboxConversationDetail(conversationId, {
          messages_limit: 100,
        });
        setSelectedConversation(detail);
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar a conversa agora.",
        });
        setSelectedConversation(null);
        setDetailError(presentation.title);
      } finally {
        setIsLoadingConversationDetail(false);
      }
    },
    [canReadConversations],
  );

  const refreshSelectedConversation = useCallback(async () => {
    if (!selectedConversationId) {
      return;
    }

    await Promise.all([
      loadConversations(selectedConversationId),
      loadConversationDetail(selectedConversationId),
    ]);
  }, [loadConversationDetail, loadConversations, selectedConversationId]);

  useEffect(() => {
    if (accessStatus !== "ready") {
      return;
    }

    void loadConversations();
  }, [accessStatus, loadConversations]);

  useEffect(() => {
    if (accessStatus !== "ready") {
      return;
    }

    void loadConversationDetail(selectedConversationId);
  }, [accessStatus, loadConversationDetail, selectedConversationId]);

  useEffect(() => {
    if (accessStatus !== "ready") {
      return;
    }

    let isActive = true;

    async function loadAssignmentOptions() {
      const [tenantUsersResult, teamsResult] = await Promise.allSettled([
        canReadMembers ? getTenantUsers() : Promise.resolve([]),
        canReadTeams ? getTeams() : Promise.resolve([]),
      ]);

      if (!isActive) {
        return;
      }

      if (tenantUsersResult.status === "fulfilled") {
        setTenantUsers(tenantUsersResult.value);
      } else {
        setTenantUsers([]);
      }

      if (teamsResult.status === "fulfilled") {
        setTeams(teamsResult.value);
      } else {
        setTeams([]);
      }
    }

    void loadAssignmentOptions();

    return () => {
      isActive = false;
    };
  }, [accessStatus, canReadMembers, canReadTeams]);

  useEffect(() => {
    if (!selectedConversation) {
      setAssignmentUserId("");
      setAssignmentTeamId("");
      setMessageSubject("");
      setMessageBody("");
      return;
    }

    setAssignmentUserId(selectedConversation.assigned_user_id ?? "");
    setAssignmentTeamId(selectedConversation.assigned_team_id ?? "");
    setMessageSubject(
      selectedConversation.channel === "email"
        ? (selectedConversation.subject ?? "")
        : "",
    );
    setMessageBody("");
  }, [selectedConversation]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
    setChannelFilter("all");
    setHasUnreadOnly(false);
  }

  async function handleMarkAsRead() {
    if (!selectedConversationId) {
      return;
    }

    setActionPending("read");

    try {
      await markInboxConversationAsRead(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Conversa marcada como lida.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível marcar a conversa como lida.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setActionPending(null);
    }
  }

  async function handleCloseConversation() {
    if (!selectedConversationId) {
      return;
    }

    setActionPending("close");

    try {
      await closeInboxConversation(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Conversa encerrada com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível encerrar a conversa.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setActionPending(null);
    }
  }

  async function handleReopenConversation() {
    if (!selectedConversationId) {
      return;
    }

    setActionPending("reopen");

    try {
      await reopenInboxConversation(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Conversa reaberta com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível reabrir a conversa.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setActionPending(null);
    }
  }

  async function handleAssignConversation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedConversationId) {
      return;
    }

    setIsSubmittingAssignment(true);

    try {
      await assignInboxConversation(selectedConversationId, {
        assigned_user_id: assignmentUserId || null,
        assigned_team_id: assignmentTeamId || null,
      });
      await refreshSelectedConversation();
      toast.success("Atribuição atualizada com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível atualizar a atribuição.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmittingAssignment(false);
    }
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedConversationId || !selectedConversation) {
      return;
    }

    if (!messageBody.trim()) {
      toast.error("Escreva a mensagem antes de enviar.");
      return;
    }

    setIsSubmittingMessage(true);

    try {
      await sendInboxConversationMessage(selectedConversationId, {
        body_text: messageBody.trim(),
        subject:
          selectedConversation.channel === "email"
            ? messageSubject.trim() || null
            : undefined,
      });
      await refreshSelectedConversation();
      setMessageBody("");
      toast.success("Mensagem enviada com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível enviar a mensagem agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmittingMessage(false);
    }
  }

  const composerDisabledReason = useMemo(() => {
    if (!selectedConversation) {
      return "Selecione uma conversa para responder.";
    }

    if (selectedConversation.status === "closed") {
      return "Reabra a conversa antes de enviar novas mensagens.";
    }

    if (
      selectedConversation.channel === "email" &&
      !selectedConversation.contact_email
    ) {
      return "Esse contato não tem e-mail para receber a mensagem.";
    }

    if (
      (selectedConversation.channel === "sms" ||
        selectedConversation.channel === "whatsapp") &&
      !selectedConversation.contact_phone_number
    ) {
      return "Esse contato não tem telefone para receber a mensagem.";
    }

    return null;
  }, [selectedConversation]);

  if (accessStatus === "loading") {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-72 items-center justify-center pt-6">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando inbox do workspace...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canReadConversations) {
    return (
      <Empty className="rounded-[2rem] border border-dashed border-border/70 bg-card/80 py-16 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Lock className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Inbox indisponível para o seu acesso</EmptyTitle>
          <EmptyDescription>
            Você precisa de permissão para visualizar as conversas deste
            workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(22rem,0.88fr)_minmax(0,1.32fr)]">
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/85 shadow-sm md:col-span-2">
            <CardContent className="grid gap-3 pt-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">Inbox</Badge>
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Inbox className="size-4" />
                </span>
              </div>
              <div className="space-y-2">
                <p className="font-serif text-4xl tracking-tight text-foreground">
                  {conversations.length}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {getConversationCounterCopy(conversations.length)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/85 shadow-sm">
            <CardContent className="grid gap-3 pt-5">
              <Badge variant="outline">Leitura</Badge>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {totalUnread} não lidas • {totalClosed} encerradas
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  O inbox já reflete o histórico operacional vindo de mensagens
                  e contatos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <CardTitle>Conversas do workspace</CardTitle>
                <CardDescription>
                  Filtre, selecione e opere as conversas mais recentes do inbox.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {searchQuery ? `Busca: ${searchQuery}` : "Sem busca ativa"}
              </Badge>
            </div>

            <form
              className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.55fr))_auto]"
              onSubmit={handleSearchSubmit}
            >
              <Field>
                <FieldLabel htmlFor="inbox-search">Busca</FieldLabel>
                <FieldContent>
                  <Input
                    id="inbox-search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Nome, e-mail, telefone ou assunto"
                  />
                </FieldContent>
              </Field>

              <SelectField
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_FILTER_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />

              <SelectField
                label="Canal"
                value={channelFilter}
                onChange={setChannelFilter}
                options={CHANNEL_FILTER_OPTIONS.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
              />

              <Field>
                <FieldLabel>Leitura</FieldLabel>
                <FieldContent>
                  <Button
                    type="button"
                    variant={hasUnreadOnly ? "default" : "outline"}
                    className="h-11 w-full justify-center"
                    onClick={() =>
                      setHasUnreadOnly((currentValue) => !currentValue)
                    }
                  >
                    <CheckCheck className="size-4" />
                    {hasUnreadOnly ? "Só não lidas" : "Todas"}
                  </Button>
                </FieldContent>
              </Field>

              <div className="flex items-end gap-2">
                <Button type="submit" variant="outline">
                  <Search className="size-4" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResetFilters}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workspaceError ? (
              <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {workspaceError}
              </div>
            ) : null}

            {isLoadingConversations ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Carregando conversas...
              </div>
            ) : conversations.length === 0 ? (
              <Empty className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/80 py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Inbox className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma conversa encontrada</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery ||
                    hasUnreadOnly ||
                    statusFilter !== "all" ||
                    channelFilter !== "all"
                      ? "Ajuste os filtros para revisar outras conversas do inbox."
                      : "Assim que mensagens inbound forem associadas a contatos, elas começam a aparecer aqui."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3">
                {conversations.map((conversation) => {
                  const isSelected = conversation.id === selectedConversationId;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      className={cn(
                        "grid gap-3 rounded-[1.5rem] border px-4 py-4 text-left transition-colors",
                        isSelected
                          ? "border-foreground/15 bg-foreground text-background shadow-sm"
                          : "border-border/70 bg-background/75 hover:border-foreground/20 hover:bg-background",
                      )}
                      onClick={() => setSelectedConversationId(conversation.id)}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">
                            {getInboxConversationDisplayName(conversation)}
                          </p>
                          <p
                            className={cn(
                              "truncate text-xs",
                              isSelected
                                ? "text-background/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {conversation.contact_email ??
                              conversation.contact_phone_number ??
                              "Sem canal principal"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isSelected ? "secondary" : "outline"}>
                            {getInboxChannelLabel(conversation.channel)}
                          </Badge>
                          <Badge variant={isSelected ? "secondary" : "outline"}>
                            {getInboxConversationStatusLabel(
                              conversation.status,
                            )}
                          </Badge>
                          {conversation.unread_count > 0 ? (
                            <Badge variant="secondary">
                              {conversation.unread_count} nova(s)
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <p
                        className={cn(
                          "line-clamp-2 text-sm leading-6",
                          isSelected
                            ? "text-background/85"
                            : "text-muted-foreground",
                        )}
                      >
                        {getInboxConversationPreview(conversation)}
                      </p>
                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 text-xs",
                          isSelected
                            ? "text-background/70"
                            : "text-muted-foreground",
                        )}
                      >
                        <span>
                          {conversation.last_message_at
                            ? formatDateTime(conversation.last_message_at)
                            : "Sem atividade recente"}
                        </span>
                        <span>
                          {conversation.last_message_direction
                            ? getInboxMessageDirectionLabel(
                                conversation.last_message_direction,
                              )
                            : "Sem tráfego"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {!selectedConversationId ? (
          <Empty className="rounded-[2rem] border border-dashed border-border/70 bg-card/80 py-16 shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircleReply className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Selecione uma conversa</EmptyTitle>
              <EmptyDescription>
                Escolha uma conversa do inbox para revisar contexto, atribuição
                e responder pelo composer.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : isLoadingConversationDetail ? (
          <Card className="bg-card/85 shadow-sm">
            <CardContent className="flex min-h-72 items-center justify-center pt-6">
              <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando conversa selecionada...
              </div>
            </CardContent>
          </Card>
        ) : detailError ? (
          <Card className="bg-card/85 shadow-sm">
            <CardContent className="pt-6">
              <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {detailError}
              </div>
            </CardContent>
          </Card>
        ) : selectedConversation ? (
          <>
            <Card className="bg-card/85 shadow-sm">
              <CardHeader className="gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {getInboxChannelLabel(selectedConversation.channel)}
                      </Badge>
                      <Badge variant="outline">
                        {getInboxConversationStatusLabel(
                          selectedConversation.status,
                        )}
                      </Badge>
                      {selectedConversation.unread_count > 0 ? (
                        <Badge variant="outline">
                          {selectedConversation.unread_count} não lida(s)
                        </Badge>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-2xl tracking-tight text-foreground">
                        {selectedConversation.contact_name ??
                          selectedConversation.contact_email ??
                          selectedConversation.contact_phone_number ??
                          "Contato sem identificação"}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                        {selectedConversation.contact_email ? (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="size-3.5" />
                            {selectedConversation.contact_email}
                          </span>
                        ) : null}
                        {selectedConversation.contact_phone_number ? (
                          <span className="inline-flex items-center gap-2">
                            <BookUser className="size-3.5" />
                            {selectedConversation.contact_phone_number}
                          </span>
                        ) : null}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void refreshSelectedConversation()}
                    >
                      <RefreshCcw className="size-4" />
                      Atualizar
                    </Button>
                    {canManageConversations &&
                    selectedConversation.unread_count > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={actionPending === "read"}
                        onClick={() => void handleMarkAsRead()}
                      >
                        <CheckCheck className="size-4" />
                        {actionPending === "read"
                          ? "Marcando..."
                          : "Marcar como lida"}
                      </Button>
                    ) : null}
                    {canManageConversations ? (
                      selectedConversation.status === "closed" ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actionPending === "reopen"}
                          onClick={() => void handleReopenConversation()}
                        >
                          <RefreshCcw className="size-4" />
                          {actionPending === "reopen"
                            ? "Reabrindo..."
                            : "Reabrir conversa"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actionPending === "close"}
                          onClick={() => void handleCloseConversation()}
                        >
                          <Inbox className="size-4" />
                          {actionPending === "close"
                            ? "Encerrando..."
                            : "Encerrar conversa"}
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Responsável
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {getAssignedUserLabel(selectedConversation, tenantUsers)}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Time
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {getAssignedTeamLabel(selectedConversation, teams)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>
                    Última atividade:{" "}
                    {selectedConversation.last_message_at
                      ? formatDateTime(selectedConversation.last_message_at)
                      : "Sem atividade"}
                  </p>
                  <p>
                    Criada em {formatDateTime(selectedConversation.created_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {canManageConversations ? (
              <Card className="bg-card/85 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle>Atribuição</CardTitle>
                  <CardDescription>
                    Direcione a conversa para um responsável ou time do
                    workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={handleAssignConversation}
                  >
                    <SelectField
                      label="Usuário responsável"
                      value={assignmentUserId}
                      onChange={setAssignmentUserId}
                      options={tenantUsers.map((user) => ({
                        label: user.email,
                        value: user.id,
                      }))}
                      placeholder={
                        canReadMembers
                          ? "Selecione um usuário"
                          : "Sem acesso para listar usuários"
                      }
                      disabled={!canReadMembers || isSubmittingAssignment}
                    />

                    <SelectField
                      label="Time atribuído"
                      value={assignmentTeamId}
                      onChange={setAssignmentTeamId}
                      options={teams.map((team) => ({
                        label: team.name,
                        value: team.id,
                      }))}
                      placeholder={
                        canReadTeams
                          ? "Selecione um time"
                          : "Sem acesso para listar times"
                      }
                      disabled={!canReadTeams || isSubmittingAssignment}
                    />

                    <div className="md:col-span-2 flex items-center justify-end">
                      <Button type="submit" disabled={isSubmittingAssignment}>
                        <UsersRound className="size-4" />
                        {isSubmittingAssignment
                          ? "Salvando..."
                          : "Salvar atribuição"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            <Card className="bg-card/85 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle>Linha do tempo</CardTitle>
                <CardDescription>
                  Histórico completo das mensagens já associadas a esta
                  conversa.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {selectedConversation.messages.length === 0 ? (
                  <Empty className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/80 py-10">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MessageCircleReply className="size-4" />
                      </EmptyMedia>
                      <EmptyTitle>Sem mensagens na conversa</EmptyTitle>
                      <EmptyDescription>
                        Assim que mensagens inbound ou outbound forem ligadas a
                        esta conversa, elas aparecem aqui.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid gap-4">
                    {selectedConversation.messages.map((message) => {
                      const isOutbound = message.direction === "outbound";

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "flex",
                            isOutbound ? "justify-end" : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[88%] rounded-[1.5rem] border px-4 py-3 shadow-sm",
                              isOutbound
                                ? "border-foreground/10 bg-foreground text-background"
                                : "border-border/70 bg-background/85 text-foreground",
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={isOutbound ? "secondary" : "outline"}
                                >
                                  {getInboxMessageDirectionLabel(
                                    message.direction,
                                  )}
                                </Badge>
                                <Badge
                                  variant={isOutbound ? "secondary" : "outline"}
                                >
                                  {message.status}
                                </Badge>
                              </div>
                              <p
                                className={cn(
                                  "text-xs",
                                  isOutbound
                                    ? "text-background/70"
                                    : "text-muted-foreground",
                                )}
                              >
                                {formatDateTime(
                                  getInboxMessageTimestamp(message),
                                )}
                              </p>
                            </div>

                            {message.subject ? (
                              <p
                                className={cn(
                                  "mt-3 text-sm font-medium",
                                  isOutbound
                                    ? "text-background"
                                    : "text-foreground",
                                )}
                              >
                                {message.subject}
                              </p>
                            ) : null}

                            <p
                              className={cn(
                                "mt-2 whitespace-pre-wrap text-sm leading-7",
                                isOutbound
                                  ? "text-background/90"
                                  : "text-muted-foreground",
                              )}
                            >
                              {message.body_text || "Mensagem sem texto"}
                            </p>

                            {message.error_detail ? (
                              <p className="mt-3 text-xs text-destructive">
                                {message.error_detail}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {canSendComposer ? (
              <Card className="bg-card/85 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle>Responder conversa</CardTitle>
                  <CardDescription>
                    Envie uma mensagem outbound no mesmo canal da conversa
                    atual.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={handleSendMessage}>
                    {selectedConversation.channel === "email" ? (
                      <Field>
                        <FieldLabel htmlFor="composer-subject">
                          Assunto do e-mail
                        </FieldLabel>
                        <FieldContent>
                          <Input
                            id="composer-subject"
                            value={messageSubject}
                            onChange={(event) =>
                              setMessageSubject(event.target.value)
                            }
                            placeholder="Assunto da resposta"
                            disabled={Boolean(composerDisabledReason)}
                          />
                        </FieldContent>
                      </Field>
                    ) : null}

                    <Field>
                      <FieldLabel htmlFor="composer-body">Mensagem</FieldLabel>
                      <FieldContent>
                        <Textarea
                          id="composer-body"
                          value={messageBody}
                          onChange={(event) =>
                            setMessageBody(event.target.value)
                          }
                          placeholder="Escreva a próxima mensagem da conversa"
                          className="min-h-32 rounded-[1.25rem] px-4 py-3"
                          disabled={Boolean(composerDisabledReason)}
                        />
                      </FieldContent>
                      {composerDisabledReason ? (
                        <FieldDescription>
                          {composerDisabledReason}
                        </FieldDescription>
                      ) : (
                        <FieldDescription>
                          O envio reaproveita o canal e o vínculo da conversa
                          atual.
                        </FieldDescription>
                      )}
                    </Field>

                    <Separator />

                    <div className="flex items-center justify-end">
                      <Button
                        type="submit"
                        disabled={
                          isSubmittingMessage || Boolean(composerDisabledReason)
                        }
                      >
                        <SendHorizontal className="size-4" />
                        {isSubmittingMessage
                          ? "Enviando..."
                          : "Enviar mensagem"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Empty className="rounded-[2rem] border border-dashed border-border/70 bg-card/80 py-12 shadow-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Lock className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Composer indisponível</EmptyTitle>
                  <EmptyDescription>
                    Você precisa da permissão de envio para responder a partir
                    desta conversa.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
