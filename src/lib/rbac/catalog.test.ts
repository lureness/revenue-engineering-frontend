import { describe, expect, it } from "vitest";

import {
  getOwnerCount,
  getPermissionsByScope,
  getWorkspaceMemberStatus,
} from "@/lib/rbac/catalog";
import type { PermissionItem, TenantUserItem } from "@/lib/rbac/types";

const PERMISSIONS: PermissionItem[] = [
  {
    id: "1",
    code: "team.members.manage",
    scope: "team",
    name: "Manage team members",
    description: "",
  },
  {
    id: "2",
    code: "tenant.permissions.manage",
    scope: "tenant",
    name: "Manage tenant permissions",
    description: "",
  },
  {
    id: "3",
    code: "tenant.members.read",
    scope: "tenant",
    name: "Read tenant members",
    description: "",
  },
];

const USERS: TenantUserItem[] = [
  {
    id: "user-1",
    tenant_id: "tenant-1",
    email: "owner@example.com",
    email_verified_at: "2026-03-15T12:00:00Z",
    role: "owner",
    is_active: true,
  },
  {
    id: "user-2",
    tenant_id: "tenant-1",
    email: "member@example.com",
    email_verified_at: null,
    role: "member",
    is_active: true,
  },
  {
    id: "user-3",
    tenant_id: "tenant-1",
    email: "inactive@example.com",
    email_verified_at: "2026-03-15T12:00:00Z",
    role: "member",
    is_active: false,
  },
];

describe("rbac catalog helpers", () => {
  it("filters and sorts workspace permissions", () => {
    expect(
      getPermissionsByScope(PERMISSIONS, "tenant").map((item) => item.code),
    ).toEqual(["tenant.members.read", "tenant.permissions.manage"]);
  });

  it("counts workspace owners", () => {
    expect(getOwnerCount(USERS)).toBe(1);
  });

  it("formats workspace member status", () => {
    const [ownerUser, pendingUser, inactiveUser] = USERS;

    expect(getWorkspaceMemberStatus(ownerUser)).toBe("Verificado");
    expect(getWorkspaceMemberStatus(pendingUser)).toBe("Pendente");
    expect(getWorkspaceMemberStatus(inactiveUser)).toBe("Inativo");
  });
});
