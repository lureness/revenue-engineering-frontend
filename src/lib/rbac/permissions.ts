import type { EffectivePermissionsResponse } from "@/lib/rbac/types";

export const TENANT_TEAMS_MANAGE_PERMISSION = "tenant.teams.manage";
export const TENANT_MEMBERS_READ_PERMISSION = "tenant.members.read";
export const TENANT_MEMBERS_MANAGE_PERMISSION = "tenant.members.manage";
export const TENANT_PERMISSIONS_MANAGE_PERMISSION = "tenant.permissions.manage";
export const TEAM_MEMBERS_READ_PERMISSION = "team.members.read";
export const TEAM_MEMBERS_MANAGE_PERMISSION = "team.members.manage";
export const TEAM_INVITES_MANAGE_PERMISSION = "team.invites.manage";

export function hasTenantPermission(
  permissions: EffectivePermissionsResponse | null,
  permissionCode: string,
) {
  if (!permissions) {
    return false;
  }

  return permissions.tenant_permissions.includes(permissionCode);
}

export function hasTeamPermission(
  permissions: EffectivePermissionsResponse | null,
  teamId: string | null | undefined,
  permissionCode: string,
) {
  if (!permissions || !teamId) {
    return false;
  }

  const teamPermissions = permissions.team_permissions.find(
    (item) => item.team_id === teamId,
  );

  return teamPermissions?.permissions.includes(permissionCode) ?? false;
}
