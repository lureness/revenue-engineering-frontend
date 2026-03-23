"use client";

import {
  CheckCircle2,
  DoorClosed,
  EllipsisVertical,
  Mail,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resendTeamInvite, revokeTeamInvite } from "@/lib/teams/api";
import type { TeamInviteItem } from "@/lib/teams/types";
import { cn } from "@/lib/utils";

type InviteRowProps = {
  invite: TeamInviteItem;
  teamId: string;
  onResent?: () => void;
  onRevoked?: () => void;
};

export function InviteRow({
  invite,
  teamId,
  onResent,
  onRevoked,
}: InviteRowProps) {
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
