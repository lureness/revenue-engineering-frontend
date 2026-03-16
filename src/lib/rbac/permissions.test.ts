import {
  hasTeamPermission,
  hasTenantPermission,
  TEAM_INVITES_MANAGE_PERMISSION,
  TENANT_TEAMS_MANAGE_PERMISSION,
} from "@/lib/rbac/permissions";
import type { EffectivePermissionsResponse } from "@/lib/rbac/types";

const permissionsFixture: EffectivePermissionsResponse = {
  tenant_permissions: ["tenant.read", "tenant.teams.manage"],
  team_permissions: [
    {
      team_id: "team-1",
      permissions: ["team.read", "team.invites.manage"],
    },
  ],
};

describe("rbac permissions helpers", () => {
  it("identifies tenant permissions", () => {
    expect(
      hasTenantPermission(permissionsFixture, TENANT_TEAMS_MANAGE_PERMISSION),
    ).toBe(true);
    expect(
      hasTenantPermission(permissionsFixture, "tenant.members.manage"),
    ).toBe(false);
  });

  it("identifies team permissions per team", () => {
    expect(
      hasTeamPermission(
        permissionsFixture,
        "team-1",
        TEAM_INVITES_MANAGE_PERMISSION,
      ),
    ).toBe(true);
    expect(
      hasTeamPermission(
        permissionsFixture,
        "team-2",
        TEAM_INVITES_MANAGE_PERMISSION,
      ),
    ).toBe(false);
  });
});
