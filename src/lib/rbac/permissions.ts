import type { EffectivePermissionsResponse } from "@/lib/rbac/types";

export const TENANT_TEAMS_MANAGE_PERMISSION = "tenant.teams.manage";
export const TENANT_MEMBERS_READ_PERMISSION = "tenant.members.read";
export const TENANT_MEMBERS_MANAGE_PERMISSION = "tenant.members.manage";
export const TENANT_PERMISSIONS_MANAGE_PERMISSION = "tenant.permissions.manage";
export const TENANT_MESSAGES_READ_PERMISSION = "tenant.messages.read";
export const TENANT_CONTACTS_READ_PERMISSION = "tenant.contacts.read";
export const TENANT_CONTACTS_MANAGE_PERMISSION = "tenant.contacts.manage";
export const TENANT_SURVEYS_READ_PERMISSION = "tenant.surveys.read";
export const TENANT_SURVEYS_MANAGE_PERMISSION = "tenant.surveys.manage";
export const TENANT_LANDING_PAGES_READ_PERMISSION = "tenant.landing_pages.read";
export const TENANT_LANDING_PAGES_MANAGE_PERMISSION =
  "tenant.landing_pages.manage";
export const TENANT_CONVERSATIONS_READ_PERMISSION = "tenant.conversations.read";
export const TENANT_CONVERSATIONS_MANAGE_PERMISSION =
  "tenant.conversations.manage";
export const TENANT_COMPOSER_SEND_PERMISSION = "tenant.composer.send";
export const TENANT_AGENTS_READ_PERMISSION = "tenant.agents.read";
export const TENANT_AGENTS_MANAGE_PERMISSION = "tenant.agents.manage";
export const TENANT_STANDARD_MESSAGES_READ_PERMISSION =
  "tenant.standard_messages.read";
export const TENANT_STANDARD_MESSAGES_MANAGE_PERMISSION =
  "tenant.standard_messages.manage";
export const TENANT_AUDIT_LOGS_READ_PERMISSION = "tenant.audit_logs.read";
export const TENANT_METRICS_READ_PERMISSION = "tenant.metrics.read";
export const TENANT_TEAMS_READ_PERMISSION = "tenant.teams.read";
export const TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION =
  "tenant.provider_accounts.read";
export const TENANT_PROVIDER_ACCOUNTS_MANAGE_PERMISSION =
  "tenant.provider_accounts.manage";
export const TENANT_WHATSAPP_SENDERS_READ_PERMISSION =
  "tenant.whatsapp_senders.read";
export const TENANT_WHATSAPP_SENDERS_MANAGE_PERMISSION =
  "tenant.whatsapp_senders.manage";
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
