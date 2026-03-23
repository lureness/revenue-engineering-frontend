"use client";

import {
  CheckCircle2,
  Crown,
  DoorClosed,
  EllipsisVertical,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";

function CreateTeamDialog({
  onCreated,
  children,
}: {
  onCreated?: (team: TeamItem) => void;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const team = await createTeam({ name, slug });
      setName("");
      setSlug("");
      setOpen(false);
      onCreated?.(team);
      toast.success(`Time "${team.name}" criado.`);
    } catch {
      toast.error("Erro ao criar time. Verifique se o slug já existe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus className="size-4" />
            Novo time
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar novo time</DialogTitle>
            <DialogDescription>
              Times permitem organizar membros e permissões dentro do workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="team-name">Nome</Label>
              <Input
                id="team-name"
                placeholder="Ex: Time de Suporte"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-slug">Slug (identificador único)</Label>
              <Input
                id="team-slug"
                placeholder="Ex: suporte"
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                required
                pattern="[a-z0-9-]+"
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar time"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({
  teamId,
  teamName,
  onInvited,
}: {
  teamId: string;
  teamName: string;
  onInvited?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createTeamInvite(teamId, { email, role });
      setEmail("");
      setRole("member");
      setOpen(false);
      onInvited?.();
      toast.success(`Convite enviado para ${email}.`);
    } catch {
      toast.error("Erro ao enviar convite.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm">
          <Mail className="size-4" />
          Convidar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Convidar para {teamName}</DialogTitle>
            <DialogDescription>
              Envie um convite por e-mail para alguém entrar neste time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="pessoa@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-role">Função</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as TeamRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({
  member,
  teamId,
  onUpdated,
  onRemoved,
}: {
  member: TeamMemberItem;
  teamId: string;
  onUpdated?: () => void;
  onRemoved?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (role: TeamRole) => {
    setIsLoading(true);
    try {
      await updateTeamMemberRole(teamId, member.user_id, role);
      onUpdated?.();
      toast.success("Função atualizada.");
    } catch {
      toast.error("Erro ao atualizar função.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await removeTeamMember(teamId, member.user_id);
      onRemoved?.();
      toast.success("Membro removido.");
    } catch {
      toast.error("Erro ao remover membro.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10">
          <Crown className="size-4 text-foreground/60" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {member.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {member.email_verified_at
              ? "E-mail verificado"
              : "E-mail não verificado"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={member.role}
          onValueChange={async (v) => {
            await handleRoleChange(v as TeamRole);
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Membro</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              disabled={isLoading}
              onClick={handleRemove}
            >
              <UserMinus className="size-4" />
              Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function InviteRow({
  invite,
  teamId,
  onResent,
  onRevoked,
}: {
  invite: TeamInviteItem;
  teamId: string;
  onResent?: () => void;
  onRevoked?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendTeamInvite(teamId, invite.id);
      onResent?.();
      toast.success("Convite reenviado.");
    } catch {
      toast.error("Erro ao reenviar convite.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    setIsLoading(true);
    try {
      await revokeTeamInvite(teamId, invite.id);
      onRevoked?.();
      toast.success("Convite revogado.");
    } catch {
      toast.error("Erro ao revogar convite.");
    } finally {
      setIsLoading(false);
    }
  };

  const isAccepted = !!invite.accepted_at;
  const isRevoked = !!invite.revoked_at;
  const isExpired =
    !isAccepted && !isRevoked && new Date(invite.expires_at) < new Date();

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            isAccepted
              ? "bg-green-500/10 text-green-600"
              : isRevoked
                ? "bg-muted text-muted-foreground"
                : isExpired
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-blue-500/10 text-blue-600",
          )}
        >
          {isAccepted ? (
            <CheckCircle2 className="size-4" />
          ) : isRevoked ? (
            <XCircle className="size-4" />
          ) : (
            <Mail className="size-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {invite.email}
          </p>
          <p className="text-xs text-muted-foreground">
            {isAccepted
              ? "Aceito"
              : isRevoked
                ? "Revogado"
                : isExpired
                  ? `Expirado em ${new Date(invite.expires_at).toLocaleDateString("pt-BR")}`
                  : `Enviado em ${new Date(invite.created_at).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground">
          {invite.role === "admin" ? "Admin" : "Membro"}
        </span>
        {!isAccepted && !isRevoked && (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon-sm">
                <EllipsisVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isLoading} onClick={handleResend}>
                <RefreshCcw className="size-4" />
                Reenviar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoading}
                onClick={handleRevoke}
              >
                <DoorClosed className="size-4" />
                Revogar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  onDeleted,
}: {
  team: TeamItem;
  onDeleted?: () => void;
}) {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [invites, setInvites] = useState<TeamInviteItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [m, i] = await Promise.all([
        getTeamMembers(team.id),
        getTeamInvites(team.id),
      ]);
      setMembers(m);
      setInvites(i);
    } catch {
      toast.error(`Erro ao carregar dados do time ${team.name}.`);
    } finally {
      setIsLoadingData(false);
    }
  }, [team.id, team.name]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeTeamMember(team.id, team.id);
      onDeleted?.();
      toast.success(`Time "${team.name}" removido.`);
    } catch {
      toast.error("Erro ao remover time.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card/85 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/10">
            <ShieldCheck className="size-5 text-foreground/60" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{team.name}</h3>
            <p className="text-xs text-muted-foreground">/{team.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InviteDialog
            teamId={team.id}
            teamName={team.name}
            onInvited={loadData}
          />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                Excluir time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-5">
        {isLoadingData ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            {members.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1">
                  <UserPlus className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Membros ({members.length})
                  </span>
                </div>
                {members.map((member) => (
                  <MemberRow
                    key={member.user_id}
                    member={member}
                    teamId={team.id}
                    onUpdated={loadData}
                    onRemoved={loadData}
                  />
                ))}
              </div>
            )}

            {invites.length > 0 && (
              <div className={cn("space-y-2", members.length > 0 && "pt-4")}>
                {members.length > 0 && <Separator />}
                <div className="flex items-center gap-2 py-1">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Convites ({invites.length})
                  </span>
                </div>
                {invites.map((invite) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    teamId={team.id}
                    onResent={loadData}
                    onRevoked={loadData}
                  />
                ))}
              </div>
            )}

            {members.length === 0 && invites.length === 0 && (
              <Empty>
                <EmptyTitle>Sem membros</EmptyTitle>
                <EmptyDescription>
                  Nenhum membro ou convite ainda. Convide alguém para começar.
                </EmptyDescription>
              </Empty>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function TeamsView() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getTeams();
      setTeams(data);
    } catch {
      toast.error("Erro ao carregar times.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {teams.length !== 0 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              ${teams.length} time{teams.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CreateTeamDialog onCreated={loadTeams} />
        </div>
      )}

      {teams.length === 0 ? (
        <Empty>
          <EmptyTitle>Nenhum time criado</EmptyTitle>
          <EmptyDescription>
            Crie seu primeiro time para organizar membros e permissões.
          </EmptyDescription>
          <CreateTeamDialog onCreated={loadTeams}>
            <Button>Criar time</Button>
          </CreateTeamDialog>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onDeleted={loadTeams} />
          ))}
        </div>
      )}
    </div>
  );
}
