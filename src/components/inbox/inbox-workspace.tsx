"use client";

import {
  BookUser,
  Bot,
  CheckCheck,
  Command,
  FileText,
  Inbox,
  Loader2,
  Lock,
  Mail,
  MessageCircleReply,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { getContacts } from "@/lib/contacts/api";
import type { ContactItem } from "@/lib/contacts/types";
import {
  assignInboxConversation,
  closeInboxConversation,
  createInboxStandardMessage,
  deleteInboxStandardMessage,
  getInboxConversationDetail,
  getInboxConversations,
  getInboxStandardMessages,
  markInboxConversationAsRead,
  pauseInboxConversationAgent,
  reopenInboxConversation,
  resumeInboxConversationAgent,
  sendInboxConversationMessage,
  takeoverInboxConversationAgent,
  updateInboxStandardMessage,
} from "@/lib/inbox/api";
import {
  getInboxChannelLabel,
  getInboxConversationAgentStatusLabel,
  getInboxConversationDisplayName,
  getInboxConversationPreview,
  getInboxConversationStatusLabel,
  getInboxMessageDirectionLabel,
  getInboxMessageTimestamp,
} from "@/lib/inbox/format";
import type {
  CreateStandardMessagePayload,
  InboxConversationDetail,
  InboxConversationListItem,
  StandardMessageItem,
  UpdateStandardMessagePayload,
} from "@/lib/inbox/types";
import { formatDateTime } from "@/lib/observability/format";
import { getTenantUsers } from "@/lib/rbac/api";
import {
  TENANT_AGENTS_MANAGE_PERMISSION,
  TENANT_AGENTS_READ_PERMISSION,
  TENANT_COMPOSER_SEND_PERMISSION,
  TENANT_CONTACTS_MANAGE_PERMISSION,
  TENANT_CONTACTS_READ_PERMISSION,
  TENANT_CONVERSATIONS_MANAGE_PERMISSION,
  TENANT_CONVERSATIONS_READ_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_STANDARD_MESSAGES_MANAGE_PERMISSION,
  TENANT_STANDARD_MESSAGES_READ_PERMISSION,
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

const STANDARD_MESSAGE_CHANNEL_OPTIONS = [
  { label: "Todos os canais compatíveis", value: "" },
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

type ActiveFilterChip = {
  key:
    | "status"
    | "channel"
    | "has_unread"
    | "assigned_user_id"
    | "assigned_team_id"
    | "contact_id";
  label: string;
};

type StandardMessageFormState = {
  code: string;
  name: string;
  description: string;
  channel: string;
  subject_template: string;
  body_template: string;
  is_active: boolean;
};

function createEmptyStandardMessageForm(): StandardMessageFormState {
  return {
    code: "",
    name: "",
    description: "",
    channel: "",
    subject_template: "",
    body_template: "",
    is_active: true,
  };
}

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

function getFilterOptionLabel(
  options: ReadonlyArray<{ label: string; value: string }>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function getContactOptionLabel(contact: ContactItem) {
  return (
    contact.name ||
    contact.email ||
    contact.phone_number ||
    "Contato sem identificação"
  );
}

function getStandardMessageChannelLabel(channel: string | null) {
  if (!channel) {
    return "Multicanal";
  }

  return getInboxChannelLabel(channel as "email" | "sms" | "whatsapp");
}

function getSurveyScoreCopy(conversation: InboxConversationDetail) {
  if (!conversation.survey) {
    return null;
  }

  const { total_score, max_score, percentage } = conversation.survey;
  if (
    typeof total_score !== "number" ||
    typeof max_score !== "number" ||
    max_score <= 0
  ) {
    return null;
  }

  const resolvedPercentage =
    typeof percentage === "number"
      ? Math.round(percentage)
      : Math.round((total_score / max_score) * 100);

  return `${total_score}/${max_score} pontos • ${resolvedPercentage}%`;
}

function getAgentStatusDescription(conversation: InboxConversationDetail) {
  switch (conversation.agent_status) {
    case "active":
      return "O especialista segue conduzindo a conversa automaticamente.";
    case "paused":
      return "O especialista está pausado e pode ser retomado a qualquer momento.";
    case "handoff":
      return "O atendimento já está em modo humano para esta conversa.";
    default:
      return "Nenhum especialista está ativo nesta conversa.";
  }
}

export function InboxWorkspace() {
  const { hasTenantPermission, status: accessStatus } = useAccess();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [hasUnreadOnly, setHasUnreadOnly] = useState(false);
  const [filterAssignedUserId, setFilterAssignedUserId] = useState("");
  const [filterAssignedTeamId, setFilterAssignedTeamId] = useState("");
  const [filterContactId, setFilterContactId] = useState("");
  const [assignmentUserId, setAssignmentUserId] = useState("");
  const [assignmentTeamId, setAssignmentTeamId] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [selectedStandardMessageId, setSelectedStandardMessageId] =
    useState("");
  const [standardMessages, setStandardMessages] = useState<
    StandardMessageItem[]
  >([]);
  const [editingStandardMessageId, setEditingStandardMessageId] = useState<
    string | null
  >(null);
  const [standardMessageForm, setStandardMessageForm] =
    useState<StandardMessageFormState>(createEmptyStandardMessageForm);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [standardMessagesError, setStandardMessagesError] = useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingConversationDetail, setIsLoadingConversationDetail] =
    useState(false);
  const [isLoadingStandardMessages, setIsLoadingStandardMessages] =
    useState(false);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [isSubmittingStandardMessage, setIsSubmittingStandardMessage] =
    useState(false);
  const [isDeletingStandardMessage, setIsDeletingStandardMessage] =
    useState(false);
  const [actionPending, setActionPending] = useState<
    "read" | "close" | "reopen" | null
  >(null);
  const [agentActionPending, setAgentActionPending] = useState<
    "pause" | "resume" | "takeover" | null
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
  const canReadContacts =
    hasTenantPermission(TENANT_CONTACTS_READ_PERMISSION) ||
    hasTenantPermission(TENANT_CONTACTS_MANAGE_PERMISSION);
  const canReadAgents = hasTenantPermission(TENANT_AGENTS_READ_PERMISSION);
  const canManageAgents = hasTenantPermission(TENANT_AGENTS_MANAGE_PERMISSION);
  const canSeeAgentContext = canReadAgents || canManageAgents;
  const canReadStandardMessages =
    hasTenantPermission(TENANT_STANDARD_MESSAGES_READ_PERMISSION) ||
    hasTenantPermission(TENANT_STANDARD_MESSAGES_MANAGE_PERMISSION);
  const canManageStandardMessages = hasTenantPermission(
    TENANT_STANDARD_MESSAGES_MANAGE_PERMISSION,
  );

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
  const userFilterOptions = useMemo(
    () =>
      tenantUsers.map((user) => ({
        label: user.email,
        value: user.id,
      })),
    [tenantUsers],
  );
  const teamFilterOptions = useMemo(
    () =>
      teams.map((team) => ({
        label: team.name,
        value: team.id,
      })),
    [teams],
  );
  const contactFilterOptions = useMemo(
    () =>
      contacts.map((contact) => ({
        label: getContactOptionLabel(contact),
        value: contact.id,
      })),
    [contacts],
  );
  const activeFilterChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];

    if (statusFilter !== "all") {
      chips.push({
        key: "status",
        label: `Status: ${getFilterOptionLabel(STATUS_FILTER_OPTIONS, statusFilter)}`,
      });
    }

    if (channelFilter !== "all") {
      chips.push({
        key: "channel",
        label: `Canal: ${getFilterOptionLabel(CHANNEL_FILTER_OPTIONS, channelFilter)}`,
      });
    }

    if (hasUnreadOnly) {
      chips.push({
        key: "has_unread",
        label: "Somente não lidas",
      });
    }

    if (filterAssignedUserId) {
      chips.push({
        key: "assigned_user_id",
        label: `Responsável: ${getFilterOptionLabel(
          userFilterOptions,
          filterAssignedUserId,
        )}`,
      });
    }

    if (filterAssignedTeamId) {
      chips.push({
        key: "assigned_team_id",
        label: `Time: ${getFilterOptionLabel(teamFilterOptions, filterAssignedTeamId)}`,
      });
    }

    if (filterContactId) {
      chips.push({
        key: "contact_id",
        label: `Contato: ${getFilterOptionLabel(contactFilterOptions, filterContactId)}`,
      });
    }

    return chips;
  }, [
    channelFilter,
    contactFilterOptions,
    filterAssignedTeamId,
    filterAssignedUserId,
    filterContactId,
    hasUnreadOnly,
    statusFilter,
    teamFilterOptions,
    userFilterOptions,
  ]);
  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    Boolean(searchQuery) ||
    activeFilterChips.length > 0;
  const hasActiveSearch = Boolean(searchInput.trim()) || Boolean(searchQuery);
  const compatibleStandardMessages = useMemo(() => {
    if (!selectedConversation) {
      return [];
    }

    return standardMessages.filter((message) => {
      if (!message.is_active) {
        return false;
      }

      return (
        !message.channel || message.channel === selectedConversation.channel
      );
    });
  }, [selectedConversation, standardMessages]);
  const selectedStandardMessage = useMemo(
    () =>
      standardMessages.find(
        (message) => message.id === selectedStandardMessageId,
      ) ?? null,
    [selectedStandardMessageId, standardMessages],
  );
  const editingStandardMessage = useMemo(
    () =>
      standardMessages.find(
        (message) => message.id === editingStandardMessageId,
      ) ?? null,
    [editingStandardMessageId, standardMessages],
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
          assigned_user_id: filterAssignedUserId || undefined,
          assigned_team_id: filterAssignedTeamId || undefined,
          contact_id: filterContactId || undefined,
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
      filterAssignedTeamId,
      filterAssignedUserId,
      filterContactId,
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

  const loadStandardMessages = useCallback(async () => {
    if (!canReadStandardMessages) {
      setStandardMessages([]);
      setStandardMessagesError(null);
      setIsLoadingStandardMessages(false);
      return;
    }

    setIsLoadingStandardMessages(true);
    setStandardMessagesError(null);

    try {
      const items = await getInboxStandardMessages({
        active_only: !canManageStandardMessages,
      });
      setStandardMessages(items);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar as mensagens padrão.",
      });
      setStandardMessages([]);
      setStandardMessagesError(presentation.title);
    } finally {
      setIsLoadingStandardMessages(false);
    }
  }, [canManageStandardMessages, canReadStandardMessages]);

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
      const [tenantUsersResult, teamsResult, contactsResult] =
        await Promise.allSettled([
          canReadMembers ? getTenantUsers() : Promise.resolve([]),
          canReadTeams ? getTeams() : Promise.resolve([]),
          canReadContacts ? getContacts({ limit: 100 }) : Promise.resolve([]),
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

      if (contactsResult.status === "fulfilled") {
        setContacts(contactsResult.value);
      } else {
        setContacts([]);
      }
    }

    void loadAssignmentOptions();

    return () => {
      isActive = false;
    };
  }, [accessStatus, canReadContacts, canReadMembers, canReadTeams]);

  useEffect(() => {
    if (accessStatus !== "ready") {
      return;
    }

    void loadStandardMessages();
  }, [accessStatus, loadStandardMessages]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchInput]);

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }

    window.addEventListener("keydown", handleSearchShortcut);

    return () => {
      window.removeEventListener("keydown", handleSearchShortcut);
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation) {
      setAssignmentUserId("");
      setAssignmentTeamId("");
      setMessageSubject("");
      setMessageBody("");
      setSelectedStandardMessageId("");
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
    setSelectedStandardMessageId("");
  }, [selectedConversation]);

  useEffect(() => {
    if (!selectedConversation || !selectedStandardMessageId) {
      return;
    }

    const isStillCompatible = compatibleStandardMessages.some(
      (message) => message.id === selectedStandardMessageId,
    );

    if (!isStillCompatible) {
      setSelectedStandardMessageId("");
    }
  }, [
    compatibleStandardMessages,
    selectedConversation,
    selectedStandardMessageId,
  ]);

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
    setFilterAssignedUserId("");
    setFilterAssignedTeamId("");
    setFilterContactId("");
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearchQuery("");
  }

  function handleRemoveFilter(filterKey: ActiveFilterChip["key"]) {
    switch (filterKey) {
      case "status":
        setStatusFilter("all");
        break;
      case "channel":
        setChannelFilter("all");
        break;
      case "has_unread":
        setHasUnreadOnly(false);
        break;
      case "assigned_user_id":
        setFilterAssignedUserId("");
        break;
      case "assigned_team_id":
        setFilterAssignedTeamId("");
        break;
      case "contact_id":
        setFilterContactId("");
        break;
    }
  }

  function resetStandardMessageEditor() {
    setEditingStandardMessageId(null);
    setStandardMessageForm(createEmptyStandardMessageForm());
  }

  function startEditingStandardMessage(message: StandardMessageItem) {
    setEditingStandardMessageId(message.id);
    setStandardMessageForm({
      code: message.code,
      name: message.name,
      description: message.description,
      channel: message.channel ?? "",
      subject_template: message.subject_template ?? "",
      body_template: message.body_template,
      is_active: message.is_active,
    });
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

  async function handlePauseAgent() {
    if (!selectedConversationId) {
      return;
    }

    setAgentActionPending("pause");

    try {
      await pauseInboxConversationAgent(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Especialista pausado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível pausar o especialista.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setAgentActionPending(null);
    }
  }

  async function handleResumeAgent() {
    if (!selectedConversationId) {
      return;
    }

    setAgentActionPending("resume");

    try {
      await resumeInboxConversationAgent(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Especialista retomado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível retomar o especialista.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setAgentActionPending(null);
    }
  }

  async function handleTakeoverConversation() {
    if (!selectedConversationId) {
      return;
    }

    setAgentActionPending("takeover");

    try {
      await takeoverInboxConversationAgent(selectedConversationId);
      await refreshSelectedConversation();
      toast.success("Atendimento assumido pelo colaborador.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível assumir o atendimento agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setAgentActionPending(null);
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

    const trimmedBody = messageBody.trim();

    if (!trimmedBody && !selectedStandardMessageId) {
      toast.error("Escreva a mensagem ou selecione uma mensagem padrão.");
      return;
    }

    setIsSubmittingMessage(true);

    try {
      await sendInboxConversationMessage(selectedConversationId, {
        body_text: trimmedBody || null,
        subject:
          selectedConversation.channel === "email"
            ? messageSubject.trim() || null
            : undefined,
        standard_message_id: selectedStandardMessageId || null,
      });
      await refreshSelectedConversation();
      setMessageBody("");
      setSelectedStandardMessageId("");
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

  async function handleSubmitStandardMessage(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canManageStandardMessages) {
      return;
    }

    setIsSubmittingStandardMessage(true);

    try {
      if (editingStandardMessageId) {
        const payload: UpdateStandardMessagePayload = {
          name: standardMessageForm.name.trim(),
          description: standardMessageForm.description.trim(),
          channel: standardMessageForm.channel || null,
          subject_template: standardMessageForm.subject_template.trim() || null,
          body_template: standardMessageForm.body_template.trim(),
          is_active: standardMessageForm.is_active,
        };
        await updateInboxStandardMessage(editingStandardMessageId, payload);
        toast.success("Mensagem padrão atualizada com sucesso.");
      } else {
        const payload: CreateStandardMessagePayload = {
          code: standardMessageForm.code.trim(),
          name: standardMessageForm.name.trim(),
          description: standardMessageForm.description.trim(),
          channel: standardMessageForm.channel || null,
          subject_template: standardMessageForm.subject_template.trim() || null,
          body_template: standardMessageForm.body_template.trim(),
          is_active: standardMessageForm.is_active,
        };
        await createInboxStandardMessage(payload);
        toast.success("Mensagem padrão criada com sucesso.");
      }

      await loadStandardMessages();
      resetStandardMessageEditor();
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível salvar a mensagem padrão.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmittingStandardMessage(false);
    }
  }

  async function handleDeleteStandardMessage() {
    if (!editingStandardMessageId || !canManageStandardMessages) {
      return;
    }

    setIsDeletingStandardMessage(true);

    try {
      await deleteInboxStandardMessage(editingStandardMessageId);
      await loadStandardMessages();
      resetStandardMessageEditor();
      if (selectedStandardMessageId === editingStandardMessageId) {
        setSelectedStandardMessageId("");
      }
      toast.success("Mensagem padrão removida com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível remover a mensagem padrão.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsDeletingStandardMessage(false);
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
                {getConversationCounterCopy(conversations.length)}
              </Badge>
            </div>

            <form className="grid gap-4" onSubmit={handleSearchSubmit}>
              <div className="space-y-3">
                <label
                  htmlFor="inbox-search"
                  className="text-sm font-medium text-foreground"
                >
                  Buscar conversas
                </label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                      {hasActiveSearch ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleClearSearch}
                          aria-label="Limpar busca"
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                      <kbd className="hidden rounded-[0.8rem] border border-border/70 bg-background px-2 py-1 text-[0.7rem] font-medium text-muted-foreground shadow-sm sm:inline-flex sm:items-center sm:gap-1">
                        <Command className="size-3" />
                        <span>K</span>
                      </kbd>
                    </div>
                    <Input
                      id="inbox-search"
                      ref={searchInputRef}
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Nome, e-mail, telefone, assunto ou contexto da conversa"
                      className="h-14 rounded-[1.4rem] border-border/70 bg-background pl-12 pr-28 text-base shadow-sm"
                    />
                  </div>

                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="outline"
                          className="h-14 min-w-36 justify-between rounded-[1.3rem] border-border/70 bg-background px-4 shadow-sm md:self-stretch"
                        />
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        <SlidersHorizontal className="size-4" />
                        Filtros
                      </span>
                      {activeFilterChips.length > 0 ? (
                        <Badge variant="secondary">
                          {activeFilterChips.length}
                        </Badge>
                      ) : null}
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      sideOffset={8}
                      className="w-[min(38rem,calc(100vw-2rem))] gap-4 rounded-[1.5rem] border border-border/70 bg-card/95 p-4 shadow-xl backdrop-blur"
                    >
                      <PopoverHeader className="gap-1">
                        <PopoverTitle>Filtros do inbox</PopoverTitle>
                        <p className="text-sm text-muted-foreground">
                          Refine o inbox por status, canal, leitura e
                          responsáveis.
                        </p>
                      </PopoverHeader>

                      <div className="grid gap-3 md:grid-cols-2">
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
                              className="h-11 w-full justify-center rounded-[1rem]"
                              onClick={() =>
                                setHasUnreadOnly(
                                  (currentValue) => !currentValue,
                                )
                              }
                            >
                              <CheckCheck className="size-4" />
                              {hasUnreadOnly ? "Somente não lidas" : "Todas"}
                            </Button>
                          </FieldContent>
                        </Field>

                        <SelectField
                          label="Responsável"
                          value={filterAssignedUserId}
                          onChange={setFilterAssignedUserId}
                          options={userFilterOptions}
                          placeholder={
                            canReadMembers
                              ? "Todos os responsáveis"
                              : "Sem acesso aos usuários"
                          }
                          disabled={!canReadMembers}
                        />

                        <SelectField
                          label="Time"
                          value={filterAssignedTeamId}
                          onChange={setFilterAssignedTeamId}
                          options={teamFilterOptions}
                          placeholder={
                            canReadTeams
                              ? "Todos os times"
                              : "Sem acesso aos times"
                          }
                          disabled={!canReadTeams}
                        />

                        <SelectField
                          label="Contato"
                          value={filterContactId}
                          onChange={setFilterContactId}
                          options={contactFilterOptions}
                          placeholder={
                            canReadContacts
                              ? "Todos os contatos"
                              : "Sem acesso aos contatos"
                          }
                          disabled={!canReadContacts}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                        <p className="text-sm text-muted-foreground">
                          {activeFilterChips.length > 0
                            ? `${activeFilterChips.length} filtro(s) ativo(s)`
                            : "Nenhum filtro secundário ativo."}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetFilters}
                          disabled={!hasActiveFilters}
                        >
                          Limpar tudo
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeFilterChips.length > 0 ? (
                  activeFilterChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => handleRemoveFilter(chip.key)}
                      className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/20 hover:text-primary"
                    >
                      <span>{chip.label}</span>
                      <X className="size-3.5" />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhum filtro secundário ativo.
                  </p>
                )}
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
                    {hasActiveFilters
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
                          {canSeeAgentContext && conversation.agent_id ? (
                            <Badge
                              variant={
                                conversation.agent_status === "active"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              <Bot className="size-3" />
                              {getInboxConversationAgentStatusLabel(
                                conversation.agent_status,
                              )}
                            </Badge>
                          ) : null}
                          {conversation.survey_result_profile_name ? (
                            <Badge
                              variant={isSelected ? "secondary" : "outline"}
                            >
                              <Sparkles className="size-3" />
                              {conversation.survey_result_profile_name}
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
                      {canSeeAgentContext && selectedConversation.agent_id ? (
                        <Badge
                          variant={
                            selectedConversation.agent_status === "active"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          <Bot className="size-3" />
                          {getInboxConversationAgentStatusLabel(
                            selectedConversation.agent_status,
                          )}
                        </Badge>
                      ) : null}
                      {selectedConversation.survey?.result_profile_name ? (
                        <Badge variant="outline">
                          <Sparkles className="size-3" />
                          {selectedConversation.survey.result_profile_name}
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
                    {canManageAgents && selectedConversation.agent_id ? (
                      selectedConversation.agent_status === "active" ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={agentActionPending === "pause"}
                          onClick={() => void handlePauseAgent()}
                        >
                          <Pause className="size-4" />
                          {agentActionPending === "pause"
                            ? "Pausando..."
                            : "Pausar agente"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={agentActionPending === "resume"}
                          onClick={() => void handleResumeAgent()}
                        >
                          <Play className="size-4" />
                          {agentActionPending === "resume"
                            ? "Retomando..."
                            : "Retomar agente"}
                        </Button>
                      )
                    ) : null}
                    {canManageAgents &&
                    selectedConversation.agent_id &&
                    selectedConversation.agent_status !== "handoff" ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={agentActionPending === "takeover"}
                        onClick={() => void handleTakeoverConversation()}
                      >
                        <UsersRound className="size-4" />
                        {agentActionPending === "takeover"
                          ? "Assumindo..."
                          : "Assumir atendimento"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div
                  className={cn(
                    "grid gap-4",
                    canSeeAgentContext ? "lg:grid-cols-2" : "lg:grid-cols-1",
                  )}
                >
                  {canSeeAgentContext ? (
                    <div className="rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Especialista
                          </p>
                          <p className="mt-1 text-sm font-medium text-foreground">
                            {selectedConversation.agent_name ??
                              "Sem especialista ativo"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            selectedConversation.agent_status === "active"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          <Bot className="size-3" />
                          {getInboxConversationAgentStatusLabel(
                            selectedConversation.agent_status,
                          )}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {selectedConversation.agent_role_title
                          ? `${selectedConversation.agent_role_title} • `
                          : null}
                        {getAgentStatusDescription(selectedConversation)}
                      </p>
                      {selectedConversation.agent_handoff_at ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Atendimento humano desde{" "}
                          {formatDateTime(
                            selectedConversation.agent_handoff_at,
                          )}
                        </p>
                      ) : selectedConversation.agent_paused_at ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Pausado em{" "}
                          {formatDateTime(selectedConversation.agent_paused_at)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Origem do survey
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {selectedConversation.survey?.template_name ??
                            "Conversa sem survey vinculado"}
                        </p>
                      </div>
                      {selectedConversation.survey ? (
                        <Badge variant="outline">
                          <Sparkles className="size-3" />
                          {selectedConversation.survey.result_profile_name ??
                            "Diagnóstico"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sem survey</Badge>
                      )}
                    </div>
                    {selectedConversation.survey ? (
                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        {getSurveyScoreCopy(selectedConversation) ? (
                          <p>{getSurveyScoreCopy(selectedConversation)}</p>
                        ) : null}
                        {selectedConversation.survey.company_name ? (
                          <p>
                            Empresa: {selectedConversation.survey.company_name}
                          </p>
                        ) : null}
                        {selectedConversation.survey.respondent_name ? (
                          <p>
                            Respondente:{" "}
                            {selectedConversation.survey.respondent_name}
                          </p>
                        ) : null}
                        {selectedConversation.survey.completed_at ? (
                          <p>
                            Concluído em{" "}
                            {formatDateTime(
                              selectedConversation.survey.completed_at,
                            )}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Quando a conversa nascer de um survey desbloqueado, o
                        resultado do diagnóstico aparece aqui.
                      </p>
                    )}
                  </div>
                </div>

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
                    {canReadStandardMessages ? (
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                        <SelectField
                          label="Mensagem padrão"
                          value={selectedStandardMessageId}
                          onChange={setSelectedStandardMessageId}
                          options={compatibleStandardMessages.map(
                            (message) => ({
                              label: message.name,
                              value: message.id,
                            }),
                          )}
                          placeholder={
                            compatibleStandardMessages.length > 0
                              ? "Selecione uma mensagem padrão"
                              : "Nenhuma mensagem padrão compatível"
                          }
                          disabled={
                            Boolean(composerDisabledReason) ||
                            isLoadingStandardMessages ||
                            compatibleStandardMessages.length === 0
                          }
                          description={
                            selectedStandardMessage
                              ? `Canal: ${getStandardMessageChannelLabel(
                                  selectedStandardMessage.channel,
                                )}${selectedStandardMessage.description ? ` • ${selectedStandardMessage.description}` : ""}`
                              : "Ao enviar sem texto manual, o template selecionado é renderizado com o contexto da conversa."
                          }
                        />
                        <div className="grid content-end gap-2">
                          {selectedStandardMessage ? (
                            <div className="rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">
                                {selectedStandardMessage.name}
                              </p>
                              <p className="mt-1 line-clamp-3 whitespace-pre-wrap">
                                {selectedStandardMessage.body_template}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

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
                      ) : selectedConversation.agent_id &&
                        selectedConversation.agent_status === "active" ? (
                        <FieldDescription>
                          Ao enviar manualmente, o atendimento passa para humano
                          e o especialista fica em handoff.
                        </FieldDescription>
                      ) : selectedStandardMessage && !messageBody.trim() ? (
                        <FieldDescription>
                          A mensagem padrão será renderizada no envio com os
                          dados do contato, survey e conversa atual.
                        </FieldDescription>
                      ) : selectedStandardMessage ? (
                        <FieldDescription>
                          O texto manual sobrescreve o corpo da mensagem padrão
                          selecionada.
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

            {canReadStandardMessages ? (
              <Card className="bg-card/85 shadow-sm">
                <CardHeader className="space-y-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <CardTitle>Mensagens padrão</CardTitle>
                      <CardDescription>
                        Cadastre respostas reutilizáveis para acelerar o
                        atendimento dentro do inbox.
                      </CardDescription>
                    </div>
                    {canManageStandardMessages ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetStandardMessageEditor}
                      >
                        <Plus className="size-4" />
                        Nova mensagem padrão
                      </Button>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-5">
                  {standardMessagesError ? (
                    <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {standardMessagesError}
                    </div>
                  ) : null}

                  {isLoadingStandardMessages ? (
                    <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Carregando mensagens padrão...
                    </div>
                  ) : standardMessages.length === 0 ? (
                    <Empty className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/80 py-10">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileText className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>
                          Nenhuma mensagem padrão cadastrada
                        </EmptyTitle>
                        <EmptyDescription>
                          {canManageStandardMessages
                            ? "Crie respostas reutilizáveis para o time acelerar o atendimento no inbox."
                            : "Quando o workspace cadastrar mensagens padrão, elas ficam listadas aqui."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="grid gap-3">
                      {standardMessages.map((message) => {
                        const isSelected =
                          message.id === editingStandardMessageId;

                        return (
                          <button
                            key={message.id}
                            type="button"
                            className={cn(
                              "grid gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
                              isSelected
                                ? "border-foreground/15 bg-foreground text-background shadow-sm"
                                : "border-border/70 bg-background/80 hover:border-foreground/20 hover:bg-background",
                            )}
                            onClick={() =>
                              canManageStandardMessages
                                ? startEditingStandardMessage(message)
                                : undefined
                            }
                            disabled={!canManageStandardMessages}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {message.name}
                                </p>
                                <p
                                  className={cn(
                                    "text-xs uppercase tracking-[0.14em]",
                                    isSelected
                                      ? "text-background/75"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {message.code}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant={isSelected ? "secondary" : "outline"}
                                >
                                  {getStandardMessageChannelLabel(
                                    message.channel,
                                  )}
                                </Badge>
                                <Badge
                                  variant={
                                    message.is_active ? "secondary" : "outline"
                                  }
                                >
                                  {message.is_active ? "Ativa" : "Inativa"}
                                </Badge>
                              </div>
                            </div>
                            {message.description ? (
                              <p
                                className={cn(
                                  "text-sm leading-6",
                                  isSelected
                                    ? "text-background/80"
                                    : "text-muted-foreground",
                                )}
                              >
                                {message.description}
                              </p>
                            ) : null}
                            <p
                              className={cn(
                                "line-clamp-3 whitespace-pre-wrap text-sm leading-6",
                                isSelected
                                  ? "text-background/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {message.body_template}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {canManageStandardMessages ? (
                    <form
                      className="grid gap-4 rounded-[1.6rem] border border-border/70 bg-background/80 p-5"
                      onSubmit={handleSubmitStandardMessage}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-base font-medium text-foreground">
                            {editingStandardMessage
                              ? "Editar mensagem padrão"
                              : "Cadastrar mensagem padrão"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Use variáveis do contexto como{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                              {"{{ contact.first_name }}"}
                            </code>{" "}
                            e{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                              {"{{ survey.result_profile_name }}"}
                            </code>
                            .
                          </p>
                        </div>
                        {editingStandardMessage ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={resetStandardMessageEditor}
                          >
                            <X className="size-4" />
                            Cancelar edição
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="standard-message-code">
                            Código
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="standard-message-code"
                              value={standardMessageForm.code}
                              onChange={(event) =>
                                setStandardMessageForm((currentValue) => ({
                                  ...currentValue,
                                  code: event.target.value,
                                }))
                              }
                              placeholder="follow-up-diagnostico"
                              disabled={
                                Boolean(editingStandardMessage) ||
                                isSubmittingStandardMessage
                              }
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="standard-message-name">
                            Nome
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="standard-message-name"
                              value={standardMessageForm.name}
                              onChange={(event) =>
                                setStandardMessageForm((currentValue) => ({
                                  ...currentValue,
                                  name: event.target.value,
                                }))
                              }
                              placeholder="Follow-up do diagnóstico"
                              disabled={isSubmittingStandardMessage}
                            />
                          </FieldContent>
                        </Field>

                        <SelectField
                          label="Canal"
                          value={standardMessageForm.channel}
                          onChange={(value) =>
                            setStandardMessageForm((currentValue) => ({
                              ...currentValue,
                              channel: value,
                            }))
                          }
                          options={STANDARD_MESSAGE_CHANNEL_OPTIONS.map(
                            (option) => ({
                              label: option.label,
                              value: option.value,
                            }),
                          )}
                          disabled={isSubmittingStandardMessage}
                        />

                        <Field>
                          <FieldLabel htmlFor="standard-message-subject">
                            Assunto
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              id="standard-message-subject"
                              value={standardMessageForm.subject_template}
                              onChange={(event) =>
                                setStandardMessageForm((currentValue) => ({
                                  ...currentValue,
                                  subject_template: event.target.value,
                                }))
                              }
                              placeholder="Opcional, usado em e-mail"
                              disabled={isSubmittingStandardMessage}
                            />
                          </FieldContent>
                        </Field>

                        <div className="md:col-span-2">
                          <Field>
                            <FieldLabel htmlFor="standard-message-description">
                              Descrição
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                id="standard-message-description"
                                value={standardMessageForm.description}
                                onChange={(event) =>
                                  setStandardMessageForm((currentValue) => ({
                                    ...currentValue,
                                    description: event.target.value,
                                  }))
                                }
                                placeholder="Quando usar esta mensagem padrão"
                                disabled={isSubmittingStandardMessage}
                              />
                            </FieldContent>
                          </Field>
                        </div>

                        <div className="md:col-span-2">
                          <Field>
                            <FieldLabel htmlFor="standard-message-body">
                              Corpo da mensagem
                            </FieldLabel>
                            <FieldContent>
                              <Textarea
                                id="standard-message-body"
                                value={standardMessageForm.body_template}
                                onChange={(event) =>
                                  setStandardMessageForm((currentValue) => ({
                                    ...currentValue,
                                    body_template: event.target.value,
                                  }))
                                }
                                className="min-h-36 rounded-[1.25rem] px-4 py-3"
                                placeholder="Olá {{ contact.first_name }}..."
                                disabled={isSubmittingStandardMessage}
                              />
                            </FieldContent>
                          </Field>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-3 rounded-[1rem] border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground">
                        <Checkbox
                          id="standard-message-active"
                          checked={standardMessageForm.is_active}
                          onCheckedChange={(checked) =>
                            setStandardMessageForm((currentValue) => ({
                              ...currentValue,
                              is_active: Boolean(checked),
                            }))
                          }
                          disabled={isSubmittingStandardMessage}
                        />
                        Disponível no composer do inbox
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {editingStandardMessage ? (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void handleDeleteStandardMessage()}
                            disabled={
                              isDeletingStandardMessage ||
                              isSubmittingStandardMessage
                            }
                          >
                            <Trash2 className="size-4" />
                            {isDeletingStandardMessage
                              ? "Removendo..."
                              : "Remover"}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Essa biblioteca fica disponível direto no composer
                            das conversas.
                          </span>
                        )}

                        <Button
                          type="submit"
                          disabled={
                            isSubmittingStandardMessage ||
                            isDeletingStandardMessage
                          }
                        >
                          <FileText className="size-4" />
                          {isSubmittingStandardMessage
                            ? "Salvando..."
                            : editingStandardMessage
                              ? "Salvar alterações"
                              : "Criar mensagem"}
                        </Button>
                      </div>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
