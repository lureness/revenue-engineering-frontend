export type TeamRole = "admin" | "member";

export type TeamItem = {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type TeamMemberItem = {
  user_id: string;
  email: string;
  role: TeamRole;
  is_active: boolean;
  email_verified_at: string | null;
};

export type TeamInviteItem = {
  id: string;
  team_id: string;
  invited_by_user_id: string;
  email: string;
  role: TeamRole;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};
