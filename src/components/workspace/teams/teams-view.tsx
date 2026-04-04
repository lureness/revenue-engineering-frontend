"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getTeams } from "@/lib/teams/api";
import type { TeamItem } from "@/lib/teams/types";

import { CreateTeamDialog } from "./create-team-dialog";
import { TeamCard } from "./team-card";

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
              {teams.length} time{teams.length !== 1 ? "s" : ""}
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
