import { apiRequest } from "@/lib/api/client";
import type {
  EffectivePermissionsResponse,
  PermissionItem,
  TenantUserItem,
  TenantUserRole,
  UserPermissionInspectionResponse,
} from "@/lib/rbac/types";

export async function getMyEffectivePermissions() {
  return apiRequest<EffectivePermissionsResponse>("/rbac/me", {
    method: "GET",
    cache: "no-store",
  });
}

export async function getPermissionCatalog() {
  return apiRequest<PermissionItem[]>("/rbac/permissions", {
    method: "GET",
    cache: "no-store",
  });
}

export async function getTenantUsers() {
  return apiRequest<TenantUserItem[]>("/tenant/users", {
    method: "GET",
    cache: "no-store",
  });
}

export async function updateTenantUserRole(
  userId: string,
  role: TenantUserRole,
) {
  return apiRequest<TenantUserItem>(`/tenant/users/${userId}/role`, {
    method: "PATCH",
    body: { role },
    cache: "no-store",
  });
}

export async function inspectTenantUserPermissions(userId: string) {
  return apiRequest<UserPermissionInspectionResponse>(
    `/rbac/tenant/users/${userId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function grantTenantUserPermission(
  userId: string,
  permissionCode: string,
) {
  return apiRequest<void>(`/rbac/tenant/users/${userId}/permissions`, {
    method: "POST",
    body: { permission_code: permissionCode },
    cache: "no-store",
  });
}

export async function revokeTenantUserPermission(
  userId: string,
  permissionCode: string,
) {
  return apiRequest<void>(
    `/rbac/tenant/users/${userId}/permissions/${permissionCode}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  );
}
