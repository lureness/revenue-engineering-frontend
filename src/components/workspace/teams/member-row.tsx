"use client";

import { Crown, MoreHorizontal, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { removeTeamMember, updateTeamMemberRole } from "@/lib/teams/api";
import type { TeamMemberItem, TeamRole } from "@/lib/teams/types";

type MemberRowProps = {
  member: TeamMemberItem;
  teamId: string;
  onUpdated?: () => void;
  onRemoved?: () => void;
};

export function MemberRow({
  member,
  teamId,
  onUpdated,
  onRemoved,
}: MemberRowProps) {
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
