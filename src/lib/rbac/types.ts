export type EffectiveTeamPermissionsItem = {
  team_id: string;
  permissions: string[];
};

export type EffectivePermissionsResponse = {
  tenant_permissions: string[];
  team_permissions: EffectiveTeamPermissionsItem[];
};
