"use client";

import {
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { formatDateTime } from "@/lib/observability/format";
import {
  getPermissionCatalog,
  getTenantUsers,
  grantTenantUserPermission,
  inspectTenantUserPermissions,
  revokeTenantUserPermission,
  updateTenantUserRole,
} from "@/lib/rbac/api";
import {
  getOwnerCount,
  getPermissionsByScope,
  getWorkspaceMemberStatus,
} from "@/lib/rbac/catalog";
import {
  TENANT_MEMBERS_MANAGE_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_PERMISSIONS_MANAGE_PERMISSION,
} from "@/lib/rbac/permissions";
import type {
  PermissionItem,
  TenantUserItem,
  TenantUserRole,
  UserPermissionInspectionResponse,
} from "@/lib/rbac/types";
import { getTeams } from "@/lib/teams/api";
import type { TeamItem } from "@/lib/teams/types";

const ROLE_OPTIONS: Array<{ label: string; value: TenantUserRole }> = [
  { label: "Owner", value: "owner" },
  { label: "Member", value: "member" },
];

function getRoleBadgeVariant(role: TenantUserRole) {
  return role === "owner" ? "secondary" : "outline";
}

function getRoleLabel(role: TenantUserRole) {
  return role === "owner" ? "Owner" : "Member";
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof UsersRound;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="grid gap-4 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{label}</Badge>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="space-y-2">
          <p className="font-serif text-4xl tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamPermissionList({
  title,
  items,
  teamNames,
}: {
  title: string;
  items: Array<{ team_id: string; permissions: string[] }>;
  teamNames: Map<string, string>;
}) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{title}</Badge>
      </div>
      {items.length === 0 ? (
        <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          Nenhuma permissão de time registrada neste recorte.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.team_id}
              className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
            >
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {teamNames.get(item.team_id) ??
                      `Time ${item.team_id.slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.team_id}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.permissions.map((permissionCode) => (
                    <Badge key={permissionCode} variant="outline">
                      {permissionCode}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function RbacWorkspace() {
  const { user, refreshSession } = useAuth();
  const {
    hasTenantPermission,
    refreshPermissions,
    status: accessStatus,
  } = useAccess();

  const [users, setUsers] = useState<TenantUserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionItem[]>(
    [],
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inspection, setInspection] =
    useState<UserPermissionInspectionResponse | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [inspectionError, setInspectionError] = useState<string | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);
  const [pendingRoleUserId, setPendingRoleUserId] = useState<string | null>(
    null,
  );
  const [pendingPermissionCode, setPendingPermissionCode] = useState<
    string | null
  >(null);

  const canReadWorkspaceUsers = hasTenantPermission(
    TENANT_MEMBERS_READ_PERMISSION,
  );
  const canManageWorkspaceUsers = hasTenantPermission(
    TENANT_MEMBERS_MANAGE_PERMISSION,
  );
  const canManageWorkspacePermissions = hasTenantPermission(
    TENANT_PERMISSIONS_MANAGE_PERMISSION,
  );

  const selectedUser =
    users.find((workspaceUser) => workspaceUser.id === selectedUserId) ?? null;
  const tenantPermissions = useMemo(
    () => getPermissionsByScope(permissionCatalog, "tenant"),
    [permissionCatalog],
  );
  const directTenantPermissions = new Set(
    inspection?.tenant_direct_permissions ?? [],
  );
  const effectiveTenantPermissions = new Set(
    inspection?.effective_permissions.tenant_permissions ?? [],
  );
  const teamNameMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team.name])),
    [teams],
  );

  const loadWorkspaceData = useCallback(
    async (preferredUserId?: string | null) => {
      if (!canReadWorkspaceUsers && !canManageWorkspacePermissions) {
        setUsers([]);
        setTeams([]);
        setPermissionCatalog([]);
        setSelectedUserId(null);
        setWorkspaceError(null);
        setIsLoadingWorkspace(false);
        return;
      }

      setIsLoadingWorkspace(true);
      setWorkspaceError(null);

      try {
        const [nextUsers, nextTeams, nextPermissionCatalog] = await Promise.all(
          [
            canReadWorkspaceUsers ? getTenantUsers() : Promise.resolve([]),
            getTeams().catch(() => []),
            canManageWorkspacePermissions
              ? getPermissionCatalog()
              : Promise.resolve([]),
          ],
        );

        setUsers(nextUsers);
        setTeams(nextTeams);
        setPermissionCatalog(nextPermissionCatalog);
        setSelectedUserId((currentValue) => {
          if (
            preferredUserId &&
            nextUsers.some(
              (workspaceUser) => workspaceUser.id === preferredUserId,
            )
          ) {
            return preferredUserId;
          }

          if (
            currentValue &&
            nextUsers.some((workspaceUser) => workspaceUser.id === currentValue)
          ) {
            return currentValue;
          }

          return nextUsers[0]?.id ?? null;
        });
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle:
            "Não foi possível carregar a governança do workspace agora.",
        });
        setWorkspaceError(presentation.title);
        setUsers([]);
        setTeams([]);
        setPermissionCatalog([]);
      } finally {
        setIsLoadingWorkspace(false);
      }
    },
    [canManageWorkspacePermissions, canReadWorkspaceUsers],
  );

  const loadInspection = useCallback(
    async (userId: string) => {
      if (!canManageWorkspacePermissions) {
        setInspection(null);
        setInspectionError(null);
        return;
      }

      setIsLoadingInspection(true);
      setInspectionError(null);

      try {
        const nextInspection = await inspectTenantUserPermissions(userId);
        setInspection(nextInspection);
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle:
            "Não foi possível carregar as permissões desse usuário agora.",
        });
        setInspection(null);
        setInspectionError(presentation.title);
      } finally {
        setIsLoadingInspection(false);
      }
    },
    [canManageWorkspacePermissions],
  );

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    void loadWorkspaceData();
  }, [accessStatus, loadWorkspaceData]);

  useEffect(() => {
    if (!selectedUserId) {
      setInspection(null);
      setInspectionError(null);
      return;
    }

    if (!canManageWorkspacePermissions) {
      setInspection(null);
      setInspectionError(null);
      return;
    }

    void loadInspection(selectedUserId);
  }, [canManageWorkspacePermissions, loadInspection, selectedUserId]);

  async function refreshCurrentAccessIfNeeded(targetUserId: string) {
    if (targetUserId !== user?.id) {
      return;
    }

    await Promise.all([refreshPermissions(), refreshSession()]);
  }

  async function handleRoleChange(userId: string, role: TenantUserRole) {
    const targetUser = users.find(
      (workspaceUser) => workspaceUser.id === userId,
    );
    if (!targetUser || targetUser.role === role) {
      return;
    }

    setPendingRoleUserId(userId);

    try {
      const updatedUser = await updateTenantUserRole(userId, role);
      setUsers((currentUsers) =>
        currentUsers.map((workspaceUser) =>
          workspaceUser.id === updatedUser.id ? updatedUser : workspaceUser,
        ),
      );

      if (inspection?.user.id === updatedUser.id) {
        setInspection((currentInspection) =>
          currentInspection
            ? {
                ...currentInspection,
                user: {
                  ...currentInspection.user,
                  role: updatedUser.role,
                },
              }
            : currentInspection,
        );
      }

      await refreshCurrentAccessIfNeeded(userId);
      toast.success(
        role === "owner"
          ? "Usuário promovido para owner."
          : "Usuário alterado para member.",
      );
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível atualizar a role desse usuário.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingRoleUserId(null);
    }
  }

  async function handleToggleDirectPermission(permissionCode: string) {
    if (!selectedUserId) {
      return;
    }

    setPendingPermissionCode(permissionCode);

    try {
      if (directTenantPermissions.has(permissionCode)) {
        await revokeTenantUserPermission(selectedUserId, permissionCode);
        toast.success("Permissão direta revogada.");
      } else {
        await grantTenantUserPermission(selectedUserId, permissionCode);
        toast.success("Permissão direta concedida.");
      }

      await loadInspection(selectedUserId);
      await refreshCurrentAccessIfNeeded(selectedUserId);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível atualizar a permissão selecionada.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setPendingPermissionCode(null);
    }
  }

  if (accessStatus === "loading" || isLoadingWorkspace) {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-72 items-center justify-center pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando governança do workspace...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canReadWorkspaceUsers && !canManageWorkspacePermissions) {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldCheck className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Sem acesso à governança</EmptyTitle>
              <EmptyDescription>
                Você precisa de permissões de membros ou RBAC para visualizar
                esta área.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Usuários"
          value={String(users.length)}
          description="Pessoas com acesso ao workspace autenticado."
          icon={UsersRound}
        />
        <MetricCard
          label="Owners"
          value={String(getOwnerCount(users))}
          description="Mantenha pelo menos um owner para preservar a administração."
          icon={ShieldCheck}
        />
        <MetricCard
          label="Permissões"
          value={String(tenantPermissions.length)}
          description="Catálogo direto de permissões disponíveis no escopo do workspace."
          icon={KeyRound}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl tracking-tight text-foreground">
                  Usuários do workspace
                </CardTitle>
                <CardDescription className="leading-7">
                  Veja quem está ativo, selecione um usuário e ajuste a role
                  global quando a sua permissão permitir.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void loadWorkspaceData(selectedUserId);
                }}
              >
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workspaceError ? (
              <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {workspaceError}
              </div>
            ) : null}

            {users.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersRound className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                  <EmptyDescription>
                    Ainda não há membros disponíveis para administrar nesta
                    área.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((workspaceUser) => {
                    const isSelected = workspaceUser.id === selectedUserId;
                    const memberStatus =
                      getWorkspaceMemberStatus(workspaceUser);

                    return (
                      <TableRow
                        key={workspaceUser.id}
                        data-state={isSelected ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedUserId(workspaceUser.id);
                        }}
                      >
                        <TableCell className="max-w-0">
                          <div className="min-w-0 space-y-1">
                            <p
                              className="truncate font-medium text-foreground"
                              title={workspaceUser.email}
                            >
                              {workspaceUser.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {workspaceUser.email_verified_at
                                ? `Verificado em ${formatDateTime(workspaceUser.email_verified_at)}`
                                : "Aguardando verificação de e-mail"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getRoleBadgeVariant(workspaceUser.role)}
                          >
                            {getRoleLabel(workspaceUser.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              memberStatus === "Verificado"
                                ? "secondary"
                                : memberStatus === "Pendente"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {memberStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManageWorkspaceUsers ? (
                            <div className="flex justify-end gap-2">
                              {ROLE_OPTIONS.map((option) => (
                                <Button
                                  key={option.value}
                                  type="button"
                                  size="xs"
                                  variant={
                                    workspaceUser.role === option.value
                                      ? "secondary"
                                      : "outline"
                                  }
                                  disabled={
                                    pendingRoleUserId === workspaceUser.id ||
                                    workspaceUser.role === option.value
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleRoleChange(
                                      workspaceUser.id,
                                      option.value,
                                    );
                                  }}
                                >
                                  {pendingRoleUserId === workspaceUser.id &&
                                  workspaceUser.role !== option.value ? (
                                    <Loader2 className="size-3 animate-spin" />
                                  ) : null}
                                  {option.label}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Somente leitura
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-card/85 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl tracking-tight text-foreground">
                    Permissões e grants
                  </CardTitle>
                  <CardDescription className="leading-7">
                    Inspecione permissões efetivas e grants diretos do usuário
                    selecionado.
                  </CardDescription>
                </div>
                {selectedUser ? (
                  <Badge variant="secondary" className="max-w-full truncate">
                    {selectedUser.email}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              {!selectedUser ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Sparkles className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Selecione um usuário</EmptyTitle>
                    <EmptyDescription>
                      Escolha um usuário da lista para ver a governança aplicada
                      ao acesso dele.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : !canManageWorkspacePermissions ? (
                <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                  Você consegue ver os usuários deste workspace, mas precisa de{" "}
                  <code className="font-mono text-[0.8rem]">
                    tenant.permissions.manage
                  </code>{" "}
                  para inspecionar grants e permissões efetivas.
                </div>
              ) : isLoadingInspection ? (
                <div className="flex min-h-52 items-center justify-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando permissões do usuário...
                  </div>
                </div>
              ) : inspectionError ? (
                <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {inspectionError}
                </div>
              ) : inspection ? (
                <div className="grid gap-6">
                  <div className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Papel atual do usuário
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getRoleBadgeVariant(inspection.user.role)}
                        >
                          {getRoleLabel(inspection.user.role)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {inspection.user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Grants diretos do workspace
                      </Badge>
                    </div>
                    {tenantPermissions.length === 0 ? (
                      <div className="rounded-[1.2rem] border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                        Nenhuma permissão cadastrada para o escopo de workspace.
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {tenantPermissions.map((permission) => {
                          const isGrantedDirectly = directTenantPermissions.has(
                            permission.code,
                          );
                          const isEffective = effectiveTenantPermissions.has(
                            permission.code,
                          );

                          return (
                            <div
                              key={permission.id}
                              className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3"
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {permission.name}
                                    </p>
                                    {isGrantedDirectly ? (
                                      <Badge variant="secondary">Direta</Badge>
                                    ) : null}
                                    {isEffective ? (
                                      <Badge variant="outline">Efetiva</Badge>
                                    ) : null}
                                  </div>
                                  <p className="text-sm leading-6 text-muted-foreground">
                                    {permission.description}
                                  </p>
                                  <code className="inline-flex rounded-xl bg-foreground/5 px-2 py-1 font-mono text-[0.72rem] text-foreground">
                                    {permission.code}
                                  </code>
                                </div>
                                <Button
                                  type="button"
                                  variant={
                                    isGrantedDirectly
                                      ? "destructive"
                                      : "outline"
                                  }
                                  size="sm"
                                  disabled={
                                    pendingPermissionCode === permission.code
                                  }
                                  onClick={() => {
                                    void handleToggleDirectPermission(
                                      permission.code,
                                    );
                                  }}
                                >
                                  {pendingPermissionCode === permission.code ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : isGrantedDirectly ? (
                                    <KeyRound className="size-4" />
                                  ) : (
                                    <CheckCircle2 className="size-4" />
                                  )}
                                  {isGrantedDirectly ? "Revogar" : "Conceder"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        Permissões efetivas do workspace
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {inspection.effective_permissions.tenant_permissions
                        .length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Nenhuma permissão efetiva encontrada.
                        </span>
                      ) : (
                        inspection.effective_permissions.tenant_permissions.map(
                          (permissionCode) => (
                            <Badge key={permissionCode} variant="outline">
                              {permissionCode}
                            </Badge>
                          ),
                        )
                      )}
                    </div>
                  </div>

                  <TeamPermissionList
                    title="Grants diretos por time"
                    items={inspection.team_direct_permissions}
                    teamNames={teamNameMap}
                  />

                  <TeamPermissionList
                    title="Permissões efetivas por time"
                    items={inspection.effective_permissions.team_permissions}
                    teamNames={teamNameMap}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
