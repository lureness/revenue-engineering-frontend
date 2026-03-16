import { apiRequest } from "@/lib/api/client";
import type { EffectivePermissionsResponse } from "@/lib/rbac/types";

export async function getMyEffectivePermissions() {
  return apiRequest<EffectivePermissionsResponse>("/rbac/me", {
    method: "GET",
    cache: "no-store",
  });
}
