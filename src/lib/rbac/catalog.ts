import type {
  PermissionItem,
  PermissionScope,
  TenantUserItem,
} from "@/lib/rbac/types";

export function getPermissionsByScope(
  permissions: PermissionItem[],
  scope: PermissionScope,
) {
  return permissions
    .filter((permission) => permission.scope === scope)
    .sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));
}

export function getOwnerCount(users: TenantUserItem[]) {
  return users.filter((user) => user.role === "owner").length;
}

export function getWorkspaceMemberStatus(user: TenantUserItem) {
  if (!user.is_active) {
    return "Inativo";
  }

  if (!user.email_verified_at) {
    return "Pendente";
  }

  return "Verificado";
}
