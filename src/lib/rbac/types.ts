export type EffectiveTeamPermissionsItem = {
  team_id: string;
  permissions: string[];
};

export type EffectivePermissionsResponse = {
  tenant_permissions: string[];
  team_permissions: EffectiveTeamPermissionsItem[];
};

export type PermissionScope = "tenant" | "team";

export type PermissionItem = {
  id: string;
  code: string;
  scope: PermissionScope;
  name: string;
  description: string;
};

export type TenantUserRole = "owner" | "member";

export type TenantUserItem = {
  id: string;
  tenant_id: string;
  email: string;
  email_verified_at: string | null;
  role: TenantUserRole;
  is_active: boolean;
};

export type UserPermissionSubject = {
  id: string;
  email: string;
  role: TenantUserRole;
};

export type DirectTeamPermissionsItem = {
  team_id: string;
  permissions: string[];
};

export type UserPermissionInspectionResponse = {
  user: UserPermissionSubject;
  tenant_direct_permissions: string[];
  team_direct_permissions: DirectTeamPermissionsItem[];
  effective_permissions: EffectivePermissionsResponse;
};
