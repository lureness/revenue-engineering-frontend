"use client";

import {
  Activity,
  ChevronRight,
  Layers3,
  Lock,
  LogOut,
  Menu,
  MessageCircleMore,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { publicEnv } from "@/lib/env";
import {
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_MESSAGES_READ_PERMISSION,
  TENANT_METRICS_READ_PERMISSION,
  TENANT_PERMISSIONS_MANAGE_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/app",
    icon: Layers3,
    status: "ativo",
    match: "exact",
  },
  {
    title: "Times",
    href: "/app/teams",
    icon: UsersRound,
    status: "ativo",
    match: "prefix",
  },
  {
    title: "Mensageria",
    href: "/app/messaging",
    icon: MessageCircleMore,
    status: "ativo",
    match: "prefix",
  },
  {
    title: "Observabilidade",
    href: "#",
    icon: Activity,
    status: "próximo",
    match: "exact",
  },
  {
    title: "RBAC",
    href: "/app/rbac",
    icon: ShieldCheck,
    status: "ativo",
    match: "exact",
  },
] as const;

const pageContentMap = {
  "/app": {
    eyebrow: "Dashboard",
    title: "Observabilidade do workspace",
    description:
      "Acompanhe tráfego, saúde operacional e sinais do produto a partir das métricas da API.",
  },
  "/app/user": {
    eyebrow: "Usuário",
    title: "Conta e preferências",
    description: "Gerencie a senha e os ajustes da sua conta autenticada.",
  },
  "/app/teams": {
    eyebrow: "Times",
    title: "Gestão de times",
    description: "Crie times, acompanhe membros e administre invites ativos.",
  },
  "/app/messaging": {
    eyebrow: "Mensageria",
    title: "Operação de mensagens",
    description:
      "Conecte provedores, acompanhe senders do WhatsApp e revise o histórico de mensagens.",
  },
  "/app/rbac": {
    eyebrow: "RBAC",
    title: "Governança de acesso",
    description:
      "Administre roles globais, grants diretos e permissões efetivas do workspace.",
  },
} as const;

type AppShellProps = {
  children: ReactNode;
  tenantName?: string;
  userEmail?: string;
  userRole?: string;
  onSignOut?: () => void | Promise<void>;
  signOutPending?: boolean;
};

type SidebarContentProps = {
  collapsed?: boolean;
  mobile?: boolean;
  onCollapse?: () => void;
  tenantName?: string;
  userEmail?: string;
  userRole?: string;
  userInitials?: string;
  onSignOut?: () => void | Promise<void>;
  signOutPending?: boolean;
};

function getUserInitials(userEmail?: string) {
  if (!userEmail) {
    return "U";
  }

  const [localPart] = userEmail.split("@");
  const chunks = localPart
    .split(/[.\-_]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length >= 2) {
    return `${chunks[0]?.[0] ?? ""}${chunks[1]?.[0] ?? ""}`.toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase() || "U";
}

function isNavigationItemActive(
  pathname: string,
  item: (typeof navigationItems)[number],
) {
  if (!item.href.startsWith("/")) {
    return false;
  }

  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarContent({
  collapsed = false,
  mobile = false,
  onCollapse,
  tenantName,
  userEmail,
  userRole,
  userInitials = "U",
  onSignOut,
  signOutPending = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { hasTenantPermission, status: accessStatus } = useAccess();

  function isNavigationItemLocked(item: (typeof navigationItems)[number]) {
    if (accessStatus !== "ready") {
      return false;
    }

    if (item.href === "/app") {
      return !hasTenantPermission(TENANT_METRICS_READ_PERMISSION);
    }

    if (item.href === "/app/rbac") {
      return !(
        hasTenantPermission(TENANT_MEMBERS_READ_PERMISSION) ||
        hasTenantPermission(TENANT_PERMISSIONS_MANAGE_PERMISSION)
      );
    }

    if (item.title === "Mensageria") {
      return !(
        hasTenantPermission(TENANT_MESSAGES_READ_PERMISSION) ||
        hasTenantPermission(TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION) ||
        hasTenantPermission(TENANT_WHATSAPP_SENDERS_READ_PERMISSION)
      );
    }

    if (item.title === "Observabilidade") {
      return !hasTenantPermission(TENANT_METRICS_READ_PERMISSION);
    }

    return false;
  }

  return (
    <div className="flex h-full flex-col gap-6">
      {mobile ? null : (
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : undefined,
          )}
        >
          <LurenessMark compact={collapsed} subtitle="Application Workspace" />
          {!collapsed && onCollapse ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onCollapse}
                aria-label="Fechar sidebar"
                title="Fechar sidebar"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {collapsed ? null : (
        <Card size="sm" className="bg-card/85 shadow-sm">
          <CardContent className="grid gap-3 pt-3">
            <Badge variant="secondary">Ambiente</Badge>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Frontend pronto para integração
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Base de API configurada para os próximos slices:
              </p>
            </div>
            <code className="overflow-hidden text-ellipsis whitespace-nowrap rounded-xl bg-foreground/5 px-3 py-2 font-mono text-[0.72rem] text-foreground">
              {publicEnv.apiBaseUrl}
            </code>
          </CardContent>
        </Card>
      )}

      <nav
        className={cn("grid gap-2", collapsed ? "justify-center" : undefined)}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isNavigable = item.href.startsWith("/");
          const isActive = isNavigationItemActive(pathname, item);
          const isLocked = isNavigationItemLocked(item);
          const itemClassName = cn(
            "flex rounded-2xl border transition-colors",
            collapsed
              ? "size-12 items-center justify-center"
              : "items-center justify-between px-4 py-3",
            isActive
              ? "border-foreground/10 bg-foreground text-background shadow-sm"
              : "border-transparent bg-transparent text-foreground hover:border-border/70 hover:text-primary",
          );
          const iconNode = <Icon className="size-4 shrink-0" />;

          if (collapsed) {
            const collapsedIcon = (
              <span className="relative inline-flex items-center justify-center">
                {iconNode}
                {isLocked ? (
                  <span
                    className={cn(
                      "absolute -right-1 -bottom-1 inline-flex size-4 items-center justify-center rounded-full border",
                      isActive
                        ? "border-foreground/20 bg-background text-foreground"
                        : "border-border/70 bg-background text-muted-foreground",
                    )}
                  >
                    <Lock className="size-2.5" />
                  </span>
                ) : null}
              </span>
            );

            if (!isNavigable) {
              return (
                <div
                  key={item.title}
                  className={itemClassName}
                  title={isLocked ? `${item.title} · restrito` : item.title}
                >
                  {collapsedIcon}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className={itemClassName}
                title={isLocked ? `${item.title} · restrito` : item.title}
                aria-label={item.title}
              >
                {collapsedIcon}
              </Link>
            );
          }

          const content = (
            <>
              <span className="flex items-center gap-3">
                {iconNode}
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  {isLocked ? (
                    <Lock
                      className={cn(
                        "size-3.5",
                        isActive
                          ? "text-background/80"
                          : "text-muted-foreground",
                      )}
                    />
                  ) : null}
                </span>
              </span>
              {isActive ? (
                <span className="pointer-events-none">
                  <Badge variant="secondary">{item.status}</Badge>
                </span>
              ) : item.status === "próximo" ? (
                <span className="pointer-events-none">
                  <Badge variant="outline">{item.status}</Badge>
                </span>
              ) : null}
            </>
          );

          if (!isNavigable) {
            return (
              <div key={item.title} className={itemClassName}>
                {content}
              </div>
            );
          }

          return (
            <Link key={item.title} href={item.href} className={itemClassName}>
              {content}
            </Link>
          );
        })}
      </nav>

      {collapsed ? (
        <div className="mt-auto grid justify-center gap-3">
          <ThemeToggle orientation="vertical" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  className="size-12 rounded-2xl p-0"
                  aria-label="Abrir menu da conta"
                  title="Abrir menu da conta"
                />
              }
            >
              <Avatar size="sm" className="pointer-events-none after:hidden">
                <AvatarFallback className="bg-foreground text-xs font-medium text-background">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="center"
              className="w-56 min-w-56"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="grid gap-0.5 px-1 py-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {userEmail ?? "Conta autenticada"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {userRole ?? "member"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/app/user" />}>
                <Settings className="size-4" />
                Minha conta
              </DropdownMenuItem>
              {onSignOut ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={signOutPending}
                    onClick={() => {
                      void onSignOut();
                    }}
                  >
                    <LogOut className="size-4" />
                    {signOutPending ? "Saindo..." : "Sair"}
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link
            href="/"
            className="inline-flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-card/85 text-foreground shadow-sm transition-colors hover:text-primary"
            aria-label="Voltar para a landing"
            title="Voltar para a landing"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-auto grid gap-4">
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          <Card size="sm" className="bg-card/85 shadow-sm">
            <CardContent className="grid gap-4 pt-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="lg" className="after:hidden">
                  <AvatarFallback className="bg-foreground text-sm font-medium text-background">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p
                    className="block w-full truncate text-sm font-medium text-foreground"
                    title={userEmail ?? "Conta autenticada"}
                  >
                    {userEmail ?? "Conta autenticada"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {userRole ?? "member"}
                  </p>
                </div>
              </div>

              <div className="min-w-0 rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Workspace ativo
                </p>
                <p
                  className="mt-1 block w-full truncate text-sm font-medium text-foreground"
                  title={tenantName ?? "Workspace atual"}
                >
                  {tenantName ?? "Workspace atual"}
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/app/user" />}
                >
                  <Settings className="size-4" />
                  Minha conta
                </Button>
                {onSignOut ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={signOutPending}
                    onClick={() => {
                      void onSignOut();
                    }}
                  >
                    <LogOut className="size-4" />
                    {signOutPending ? "Saindo..." : "Sair"}
                  </Button>
                ) : null}
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Voltar para a landing
                <ChevronRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  children,
  tenantName,
  userEmail,
  userRole,
  onSignOut,
  signOutPending = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pageContent =
    pageContentMap[pathname as keyof typeof pageContentMap] ??
    pageContentMap["/app"];
  const userInitials = getUserInitials(userEmail);

  return (
    <div className="page-frame min-h-screen">
      <div className={cn("relative min-h-screen")}>
        <aside
          className={cn(
            "surface-panel-strong hidden border-b border-border/70 p-5 lg:fixed lg:top-4 lg:bottom-4 lg:left-4 lg:z-20 lg:flex lg:flex-col lg:overflow-y-auto lg:rounded-[2rem] lg:border lg:shadow-lg",
            isSidebarCollapsed ? "lg:w-24 lg:px-4 lg:py-6" : "lg:w-72 lg:p-6",
          )}
        >
          <SidebarContent
            collapsed={isSidebarCollapsed}
            onCollapse={() => setIsSidebarCollapsed(true)}
            tenantName={tenantName}
            userEmail={userEmail}
            userRole={userRole}
            userInitials={userInitials}
            onSignOut={onSignOut}
            signOutPending={signOutPending}
          />
        </aside>

        <div
          className={cn(
            "relative flex min-h-screen flex-col transition-[padding-left] duration-300 ease-out",
            isSidebarCollapsed ? "lg:pl-32" : "lg:pl-80",
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-lureness-glow-dark opacity-80" />
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-15" />
          <header className="relative z-10 flex flex-col gap-3 border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur md:flex-row md:items-end md:justify-between lg:mx-4 lg:mt-4 lg:rounded-[2rem] lg:border lg:bg-background/85 lg:px-8 lg:py-6 lg:shadow-sm">
            <div
              className={cn(
                "flex w-full items-start justify-between gap-4 lg:w-auto lg:justify-start",
                isSidebarCollapsed
                  ? "lg:items-center lg:gap-5"
                  : "lg:items-start lg:gap-3",
              )}
            >
              <div className="order-2 lg:hidden">
                <Sheet
                  open={isMobileSidebarOpen}
                  onOpenChange={setIsMobileSidebarOpen}
                >
                  <SheetTrigger
                    render={<Button variant="outline" size="icon-sm" />}
                    aria-label="Abrir menu lateral"
                  >
                    <Menu className="size-4" />
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    showCloseButton={false}
                    className="w-[88vw] max-w-sm border-r border-border bg-background/95 p-0 backdrop-blur-xl"
                  >
                    <SheetHeader className="border-b border-border/70 pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <SheetTitle className="sr-only">
                            Menu lateral
                          </SheetTitle>
                          <LurenessMark subtitle="Application Workspace" />
                        </div>
                        <SheetClose
                          render={
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label="Fechar menu lateral"
                              title="Fechar menu lateral"
                            />
                          }
                        >
                          <PanelLeftClose className="size-4" />
                        </SheetClose>
                      </div>
                    </SheetHeader>
                    <SheetBody className="thin-scrollbar p-4">
                      <SidebarContent
                        mobile
                        tenantName={tenantName}
                        userEmail={userEmail}
                        userRole={userRole}
                        userInitials={userInitials}
                        onSignOut={onSignOut}
                        signOutPending={signOutPending}
                      />
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              </div>
              {isSidebarCollapsed ? (
                <div className="hidden lg:block">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setIsSidebarCollapsed(false)}
                    aria-label="Abrir sidebar"
                    title="Abrir sidebar"
                  >
                    <PanelLeftOpen className="size-4" />
                  </Button>
                </div>
              ) : null}
              <div className="order-1 space-y-1">
                <p className="eyebrow">{pageContent.eyebrow}</p>
                <h1 className="font-serif text-3xl tracking-tight text-foreground">
                  {pageContent.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {pageContent.description}
                </p>
              </div>
            </div>
          </header>

          <main className="relative z-10 flex-1 px-6 py-8 lg:px-4 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
