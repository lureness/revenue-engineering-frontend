import type { TeamRole } from "@/lib/teams/types";

export type ResolvedTeamInvite = {
  team_id: string;
  team_name: string;
  team_slug: string;
  email: string;
  role: TeamRole;
  account_exists: boolean;
  expires_at: string;
};
