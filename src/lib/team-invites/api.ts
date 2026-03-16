import { apiRequest } from "@/lib/api/client";
import type { AuthSession } from "@/lib/auth/session";
import type { ResolvedTeamInvite } from "@/lib/team-invites/types";

export async function resolveTeamInvite(token: string) {
  return apiRequest<ResolvedTeamInvite>("/team-invites/resolve", {
    method: "GET",
    query: { token },
    cache: "no-store",
  });
}

export async function acceptTeamInvite(token: string) {
  return apiRequest<void>("/team-invites/accept", {
    method: "POST",
    body: { token },
    cache: "no-store",
  });
}

export async function registerFromTeamInvite(token: string, password: string) {
  return apiRequest<AuthSession>("/team-invites/register", {
    method: "POST",
    body: {
      token,
      password,
    },
    cache: "no-store",
  });
}
