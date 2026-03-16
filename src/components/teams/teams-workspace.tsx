"use client";

import {
  FolderKanban,
  Loader2,
  MailPlus,
  MoreHorizontal,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDateTime } from "@/lib/observability/format";
import {
  createTeam,
  createTeamInvite,
  getTeamInvites,
  getTeamMembers,
  getTeams,
  removeTeamMember,
  resendTeamInvite,
  revokeTeamInvite,
  updateTeamMemberRole,
} from "@/lib/teams/api";
import type {
  TeamInviteItem,
  TeamItem,
  TeamMemberItem,
  TeamRole,
} from "@/lib/teams/types";
import { isValidTeamSlug, slugifyTeamName } from "@/lib/teams/validation";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{
  label: string;
  value: TeamRole;
}> = [
  { label: "Membro", value: "member" },
  { label: "Admin", value: "admin" },
];

function getRoleLabel(role: TeamRole) {
  return role === "admin" ? "Admin" : "Membro";
}

function getRoleBadgeVariant(role: TeamRole) {
  return role === "admin" ? "secondary" : "outline";
}

export function TeamsWorkspace() {
  const { user } = useAuth();

  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [invites, setInvites] = useState<TeamInviteItem[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  const [teamSlugManuallyEdited, setTeamSlugManuallyEdited] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");

  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);

  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null;

  useEffect(() => {
    if (teamSlugManuallyEdited) {
      return;
    }

    setTeamSlug(slugifyTeamName(teamName));
  }, [teamName, teamSlugManuallyEdited]);

  const loadTeams = useEffectEvent(async (preferredTeamId?: string | null) => {
    setIsLoadingTeams(true);
    setTeamsError(null);

    try {
      const nextTeams = await getTeams();
      setTeams(nextTeams);
      setSelectedTeamId((currentValue) => {
        if (
          preferredTeamId &&
          nextTeams.some((team) => team.id === preferredTeamId)
        ) {
          return preferredTeamId;
        }

        if (
          currentValue &&
          nextTeams.some((team) => team.id === currentValue)
        ) {
          return currentValue;
        }

        return nextTeams[0]?.id ?? null;
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar os times agora.",
      });
      setTeamsError(presentation.title);
      setTeams([]);
    } finally {
      setIsLoadingTeams(false);
    }
  });

  const loadTeamDetails = useEffectEvent(async (teamId: string) => {
    setIsLoadingDetails(true);
    setDetailsError(null);

    try {
      const [nextMembers, nextInvites] = await Promise.all([
        getTeamMembers(teamId),
        getTeamInvites(teamId),
      ]);

      setMembers(nextMembers);
      setInvites(nextInvites);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar os dados do time.",
      });
      setDetailsError(presentation.title);
      setMembers([]);
      setInvites([]);
    } finally {
      setIsLoadingDetails(false);
    }
  });

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    if (!selectedTeamId) {
      setMembers([]);
      setInvites([]);
      setDetailsError(null);
      return;
    }

    void loadTeamDetails(selectedTeamId);
  }, [selectedTeamId, loadTeamDetails]);

  async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = teamName.trim();
    const normalizedSlug = slugifyTeamName(teamSlug);

    if (normalizedName.length < 2) {
      toast.error("Informe um nome de time com pelo menos 2 caracteres.");
      return;
    }

    if (!isValidTeamSlug(normalizedSlug)) {
      toast.error(
        "Use um slug com 3 a 100 caracteres, apenas letras minúsculas, números e hífens.",
      );
      return;
    }

    setIsCreatingTeam(true);

    try {
      const createdTeam = await createTeam({
        name: normalizedName,
        slug: normalizedSlug,
      });

      setTeamName("");
      setTeamSlug("");
      setTeamSlugManuallyEdited(false);
      toast.success("Time criado com sucesso.");
      await loadTeams(createdTeam.id);
      await loadTeamDetails(createdTeam.id);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível criar o time.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingTeam(false);
    }
  }

  async function handleCreateInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTeamId) {
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Informe um e-mail válido para enviar o invite.");
      return;
    }

    setIsCreatingInvite(true);

    try {
      await createTeamInvite(selectedTeamId, {
        email: normalizedEmail,
        role: inviteRole,
      });

      setInviteEmail("");
      setInviteRole("member");
      toast.success("Invite enviado com sucesso.");
      await loadTeamDetails(selectedTeamId);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível enviar o invite agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingInvite(false);
    }
  }

  async function handleUpdateMemberRole(
    member: TeamMemberItem,
    role: TeamRole,
  ) {
    if (!selectedTeamId || member.role === role) {
      return;
    }

    setPendingMemberId(member.user_id);

    try {
      await updateTeamMemberRole(selectedTeamId, member.user_id, role);
      toast.success("Role do membro atualizada.");
      await loadTeamDetails(selectedTeamId);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível atualizar a role do membro.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingMemberId(null);
    }
  }

  async function handleRemoveMember(member: TeamMemberItem) {
    if (!selectedTeamId) {
      return;
    }

    setPendingMemberId(member.user_id);

    try {
      await removeTeamMember(selectedTeamId, member.user_id);
      toast.success("Membro removido do time.");
      await loadTeams(selectedTeamId);
      if (selectedTeamId && member.user_id !== user?.id) {
        await loadTeamDetails(selectedTeamId);
      }
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível remover o membro.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingMemberId(null);
    }
  }

  async function handleResendInvite(invite: TeamInviteItem) {
    if (!selectedTeamId) {
      return;
    }

    setPendingInviteId(invite.id);

    try {
      await resendTeamInvite(selectedTeamId, invite.id);
      toast.success("Invite reenviado com sucesso.");
      await loadTeamDetails(selectedTeamId);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível reenviar o invite.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingInviteId(null);
    }
  }

  async function handleRevokeInvite(invite: TeamInviteItem) {
    if (!selectedTeamId) {
      return;
    }

    setPendingInviteId(invite.id);

    try {
      await revokeTeamInvite(selectedTeamId, invite.id);
      toast.success("Invite revogado.");
      await loadTeamDetails(selectedTeamId);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível revogar o invite.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingInviteId(null);
    }
  }

  async function handleRefreshSelectedTeam() {
    if (!selectedTeamId) {
      return;
    }

    await loadTeams(selectedTeamId);
    await loadTeamDetails(selectedTeamId);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
      <div className="grid h-fit gap-6">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Novo time
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Criar time
            </CardTitle>
            <CardDescription className="leading-7">
              Defina o nome e o identificador do próximo time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCreateTeam}>
              <Field>
                <FieldLabel htmlFor="team-name">Nome do time</FieldLabel>
                <FieldContent>
                  <Input
                    id="team-name"
                    placeholder="Sales Ops"
                    value={teamName}
                    onChange={(event) => setTeamName(event.currentTarget.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="team-slug">Slug do time</FieldLabel>
                <FieldContent>
                  <Input
                    id="team-slug"
                    placeholder="sales-ops"
                    value={teamSlug}
                    onChange={(event) => {
                      setTeamSlugManuallyEdited(true);
                      setTeamSlug(slugifyTeamName(event.currentTarget.value));
                    }}
                  />
                  <FieldDescription>
                    Use minúsculas, números e hífens.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Button type="submit" size="lg" disabled={isCreatingTeam}>
                {isCreatingTeam ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FolderKanban className="size-4" />
                )}
                {isCreatingTeam ? "Criando..." : "Criar time"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Times
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Selecionar time
            </CardTitle>
            <CardDescription className="leading-7">
              Escolha o time que você quer gerenciar agora.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {isLoadingTeams ? (
              <div className="flex items-center gap-2 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando times...
              </div>
            ) : null}

            {!isLoadingTeams && teamsError ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderKanban className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>{teamsError}</EmptyTitle>
                  <EmptyDescription>
                    Tente atualizar a página para carregar a lista novamente.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {!isLoadingTeams && !teamsError && teams.length === 0 ? (
              <Empty className="border border-border/70 bg-background/70">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderKanban className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum time criado ainda</EmptyTitle>
                  <EmptyDescription>
                    Crie o primeiro time para começar a organizar pessoas e
                    invites.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}

            {!isLoadingTeams && !teamsError
              ? teams.map((team) => {
                  const isSelected = team.id === selectedTeamId;

                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelectedTeamId(team.id)}
                      className={cn(
                        "grid gap-3 rounded-[1.4rem] border px-4 py-4 text-left transition-colors",
                        isSelected
                          ? "border-foreground/10 bg-foreground text-background shadow-sm"
                          : "border-border/70 bg-background/80 text-foreground hover:border-foreground/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {team.name}
                          </p>
                          <p
                            className={cn(
                              "mt-1 font-mono text-xs",
                              isSelected
                                ? "text-background/75"
                                : "text-muted-foreground",
                            )}
                          >
                            {team.slug}
                          </p>
                        </div>
                        <Badge
                          variant={isSelected ? "secondary" : "outline"}
                          className="shrink-0"
                        >
                          {isSelected ? "Selecionado" : "Abrir"}
                        </Badge>
                      </div>
                      <p
                        className={cn(
                          "text-xs",
                          isSelected
                            ? "text-background/75"
                            : "text-muted-foreground",
                        )}
                      >
                        Criado em {formatDateTime(team.created_at)}
                      </p>
                    </button>
                  );
                })
              : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {!selectedTeam ? (
          <Empty className="border border-border/70 bg-card/85 shadow-sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Selecione um time</EmptyTitle>
              <EmptyDescription>
                Quando um time for escolhido, a gestão de membros e invites
                aparece aqui.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <Card className="bg-card/85 shadow-sm">
              <CardHeader className="gap-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <Badge variant="secondary" className="w-fit">
                      Time selecionado
                    </Badge>
                    <div>
                      <CardTitle className="text-2xl tracking-tight text-foreground">
                        {selectedTeam.name}
                      </CardTitle>
                      <CardDescription className="mt-2 leading-7">
                        {selectedTeam.slug}
                      </CardDescription>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void handleRefreshSelectedTeam();
                    }}
                    disabled={isLoadingDetails}
                  >
                    {isLoadingDetails ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="size-4" />
                    )}
                    Atualizar
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {members.length}{" "}
                    {members.length === 1 ? "membro" : "membros"}
                  </Badge>
                  <Badge variant="outline">
                    {invites.length}{" "}
                    {invites.length === 1 ? "invite ativo" : "invites ativos"}
                  </Badge>
                  <Badge variant="outline">
                    Criado em {formatDateTime(selectedTeam.created_at)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_24rem]">
              <Card className="bg-card/85 shadow-sm">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Membros
                  </Badge>
                  <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
                    Pessoas do time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {detailsError ? (
                    <Empty className="border border-border/70 bg-background/70">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UsersRound className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>{detailsError}</EmptyTitle>
                        <EmptyDescription>
                          Atualize o time para tentar novamente.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : members.length === 0 && !isLoadingDetails ? (
                    <Empty className="border border-border/70 bg-background/70">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UsersRound className="size-4" />
                        </EmptyMedia>
                        <EmptyTitle>Nenhum membro encontrado</EmptyTitle>
                        <EmptyDescription>
                          Os membros adicionados ao time aparecem aqui.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pessoa</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[6rem] text-right">
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => {
                            const isPending =
                              pendingMemberId === member.user_id;
                            const isCurrentUser = member.user_id === user?.id;

                            return (
                              <TableRow key={member.user_id}>
                                <TableCell>
                                  <div className="grid gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-foreground">
                                        {member.email}
                                      </span>
                                      {isCurrentUser ? (
                                        <Badge variant="outline">Você</Badge>
                                      ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      <span>
                                        {member.email_verified_at
                                          ? "E-mail verificado"
                                          : "Aguardando verificação"}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={getRoleBadgeVariant(member.role)}
                                  >
                                    {getRoleLabel(member.role)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      member.is_active ? "secondary" : "outline"
                                    }
                                  >
                                    {member.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          aria-label="Abrir ações do membro"
                                        />
                                      }
                                    >
                                      {isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                      ) : (
                                        <MoreHorizontal className="size-4" />
                                      )}
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-56"
                                    >
                                      <DropdownMenuGroup>
                                        <DropdownMenuLabel>
                                          Ações do membro
                                        </DropdownMenuLabel>
                                        {member.role === "admin" ? (
                                          <DropdownMenuItem
                                            disabled={isPending}
                                            onClick={() => {
                                              void handleUpdateMemberRole(
                                                member,
                                                "member",
                                              );
                                            }}
                                          >
                                            <UsersRound className="size-4" />
                                            Tornar membro
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            disabled={isPending}
                                            onClick={() => {
                                              void handleUpdateMemberRole(
                                                member,
                                                "admin",
                                              );
                                            }}
                                          >
                                            <ShieldCheck className="size-4" />
                                            Tornar admin
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuGroup>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        variant="destructive"
                                        disabled={isPending}
                                        onClick={() => {
                                          void handleRemoveMember(member);
                                        }}
                                      >
                                        <Trash2 className="size-4" />
                                        Remover do time
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid h-fit gap-6">
                <Card className="bg-card/85 shadow-sm">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      Invite
                    </Badge>
                    <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
                      Convidar pessoa
                    </CardTitle>
                    <CardDescription className="leading-7">
                      Envie um invite direto para o e-mail da pessoa.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="grid gap-4" onSubmit={handleCreateInvite}>
                      <Field>
                        <FieldLabel htmlFor="invite-email">E-mail</FieldLabel>
                        <FieldContent>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="ana@empresa.com"
                            value={inviteEmail}
                            onChange={(event) =>
                              setInviteEmail(event.currentTarget.value)
                            }
                          />
                        </FieldContent>
                      </Field>

                      <Field>
                        <FieldLabel>Role inicial</FieldLabel>
                        <FieldContent>
                          <div className="grid grid-cols-2 gap-2">
                            {ROLE_OPTIONS.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={
                                  inviteRole === option.value
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() => setInviteRole(option.value)}
                              >
                                {option.label}
                              </Button>
                            ))}
                          </div>
                        </FieldContent>
                      </Field>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isCreatingInvite}
                      >
                        {isCreatingInvite ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MailPlus className="size-4" />
                        )}
                        {isCreatingInvite ? "Enviando..." : "Enviar invite"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="bg-card/85 shadow-sm">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      Invites ativos
                    </Badge>
                    <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
                      Convites em aberto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {invites.length === 0 && !isLoadingDetails ? (
                      <Empty className="border border-border/70 bg-background/70">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <UserRoundPlus className="size-4" />
                          </EmptyMedia>
                          <EmptyTitle>Nenhum invite ativo</EmptyTitle>
                          <EmptyDescription>
                            Os convites pendentes aparecem aqui.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : null}

                    {invites.map((invite) => {
                      const isPending = pendingInviteId === invite.id;

                      return (
                        <div
                          key={invite.id}
                          className="grid gap-4 rounded-[1.2rem] border border-border/70 bg-background/80 px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {invite.email}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Expira em {formatDateTime(invite.expires_at)}
                              </p>
                            </div>
                            <Badge variant={getRoleBadgeVariant(invite.role)}>
                              {getRoleLabel(invite.role)}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => {
                                void handleResendInvite(invite);
                              }}
                            >
                              {isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="size-4" />
                              )}
                              Reenviar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={isPending}
                              onClick={() => {
                                void handleRevokeInvite(invite);
                              }}
                            >
                              <Trash2 className="size-4" />
                              Revogar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
