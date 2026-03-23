"use client";

import { MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeamInvites, getTeamMembers } from "@/lib/teams/api";
import type {
  TeamInviteItem,
  TeamItem,
  TeamMemberItem,
} from "@/lib/teams/types";

import { InviteDialog } from "./invite-dialog";
import { InviteRow } from "./invite-row";
import { MemberRow } from "./member-row";

type TeamCardProps = {
  team: TeamItem;
  onDeleted?: () => void;
};

export function TeamCard({ team, onDeleted }: TeamCardProps) {
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [invites, setInvites] = useState<TeamInviteItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

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
              <DropdownMenuItem variant="destructive" onClick={onDeleted}>
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
              <div className="space-y-2">
                {members.length > 0 && <Separator />}
                <div className="flex items-center gap-2 py-1">
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
