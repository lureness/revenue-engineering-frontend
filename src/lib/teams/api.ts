import { apiRequest } from "@/lib/api/client";
import type {
  TeamInviteItem,
  TeamItem,
  TeamMemberItem,
  TeamRole,
} from "@/lib/teams/types";

export type CreateTeamPayload = {
  name: string;
  slug: string;
};

export type CreateTeamInvitePayload = {
  email: string;
  role: TeamRole;
};

export async function getTeams() {
  return apiRequest<TeamItem[]>("/teams", {
    method: "GET",
    cache: "no-store",
  });
}

export async function createTeam(payload: CreateTeamPayload) {
  return apiRequest<TeamItem>("/teams", {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function getTeamMembers(teamId: string) {
  return apiRequest<TeamMemberItem[]>(`/teams/${teamId}/members`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole,
) {
  return apiRequest<TeamMemberItem>(`/teams/${teamId}/members/${userId}/role`, {
    method: "PATCH",
    body: { role },
    cache: "no-store",
  });
}

export async function removeTeamMember(teamId: string, userId: string) {
  return apiRequest<void>(`/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    cache: "no-store",
  });
}

export async function getTeamInvites(teamId: string) {
  return apiRequest<TeamInviteItem[]>(`/teams/${teamId}/invites`, {
    method: "GET",
    cache: "no-store",
  });
}

export async function createTeamInvite(
  teamId: string,
  payload: CreateTeamInvitePayload,
) {
  return apiRequest<TeamInviteItem>(`/teams/${teamId}/invites`, {
    method: "POST",
    body: payload,
    cache: "no-store",
  });
}

export async function resendTeamInvite(teamId: string, inviteId: string) {
  return apiRequest<TeamInviteItem>(
    `/teams/${teamId}/invites/${inviteId}/resend`,
    {
      method: "POST",
      cache: "no-store",
    },
  );
}

export async function revokeTeamInvite(teamId: string, inviteId: string) {
  return apiRequest<void>(`/teams/${teamId}/invites/${inviteId}/revoke`, {
    method: "POST",
    cache: "no-store",
  });
}
