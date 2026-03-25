"use client";

import {
  Activity,
  BookUser,
  Bot,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileText,
  Inbox,
  Layers3,
  Lock,
  LogOut,
  Magnet,
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
import {
  TENANT_AGENTS_MANAGE_PERMISSION,
  TENANT_AGENTS_READ_PERMISSION,
  TENANT_AUDIT_LOGS_READ_PERMISSION,
  TENANT_CONTACTS_MANAGE_PERMISSION,
  TENANT_CONTACTS_READ_PERMISSION,
  TENANT_CONVERSATIONS_READ_PERMISSION,
  TENANT_LANDING_PAGES_MANAGE_PERMISSION,
  TENANT_LANDING_PAGES_READ_PERMISSION,
  TENANT_MEMBERS_READ_PERMISSION,
  TENANT_MESSAGES_READ_PERMISSION,
  TENANT_METRICS_READ_PERMISSION,
  TENANT_PERMISSIONS_MANAGE_PERMISSION,
  TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION,
  TENANT_SURVEYS_MANAGE_PERMISSION,
  TENANT_SURVEYS_READ_PERMISSION,
  TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: typeof Layers3;
  match: "exact" | "prefix";
  permission?: string;
  hasChildren?: boolean;
  children?: boolean;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const navigationGroups: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        href: "/workspace/[slug]",
        icon: Layers3,
        match: "exact",
        permission: TENANT_METRICS_READ_PERMISSION,
      },
    ],
  },
  {
    title: "Operações",
    items: [
      {
        title: "Inbox",
        href: "/workspace/[slug]/inbox",
        icon: Inbox,
        match: "prefix",
        permission: TENANT_CONVERSATIONS_READ_PERMISSION,
        hasChildren: true,
      },
      {
        title: "Contatos",
        href: "/workspace/[slug]/inbox/contacts",
        icon: BookUser,
        match: "prefix",
        permission:
          TENANT_CONTACTS_READ_PERMISSION || TENANT_CONTACTS_MANAGE_PERMISSION,
        children: true,
      },
      {
        title: "Agents",
        href: "/workspace/[slug]/agents",
        icon: Bot,
        match: "prefix",
        permission:
          TENANT_AGENTS_READ_PERMISSION || TENANT_AGENTS_MANAGE_PERMISSION,
        children: true,
      },
      {
        title: "Times",
        href: "/workspace/[slug]/teams",
        icon: UsersRound,
        match: "prefix",
      },
      {
        title: "Surveys",
        href: "/workspace/[slug]/surveys",
        icon: FileText,
        match: "prefix",
        permission:
          TENANT_SURVEYS_READ_PERMISSION || TENANT_SURVEYS_MANAGE_PERMISSION,
      },
      {
        title: "LPs",
        href: "/workspace/[slug]/lp",
        icon: Layers3,
        match: "prefix",
        permission:
          TENANT_LANDING_PAGES_READ_PERMISSION ||
          TENANT_LANDING_PAGES_MANAGE_PERMISSION,
      },
      {
        title: "Mensagens",
        href: "/workspace/[slug]/inbox/messages",
        icon: MessageCircleMore,
        match: "prefix",
        permission:
          TENANT_MESSAGES_READ_PERMISSION ||
          TENANT_PROVIDER_ACCOUNTS_READ_PERMISSION ||
          TENANT_WHATSAPP_SENDERS_READ_PERMISSION,
        children: true,
      },
      {
        title: "Iscas",
        href: "/workspace/[slug]/hooks",
        icon: Magnet,
        match: "prefix",
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        title: "Observabilidade",
        href: "/workspace/[slug]/settings/observability",
        icon: Activity,
        match: "prefix",
        permission:
          TENANT_METRICS_READ_PERMISSION || TENANT_AUDIT_LOGS_READ_PERMISSION,
      },
      {
        title: "RBAC",
        href: "/workspace/[slug]/settings/rbac",
        icon: ShieldCheck,
        match: "exact",
        permission:
          TENANT_MEMBERS_READ_PERMISSION ||
          TENANT_PERMISSIONS_MANAGE_PERMISSION,
      },
    ],
  },
];

const pageContentMap: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "/workspace/[slug]": {
    eyebrow: "Dashboard",
    title: "Dashboard do workspace",
    description: "Visão geral das métricas e indicadores do seu workspace.",
  },
  "/workspace/[slug]/settings/account": {
    eyebrow: "Usuário",
    title: "Conta e preferências",
    description: "Gerencie a senha e os ajustes da sua conta autenticada.",
  },
  "/workspace/[slug]/teams": {
    eyebrow: "Times",
    title: "Gestão de times",
    description: "Crie times, acompanhe membros e administre invites ativos.",
  },
  "/workspace/[slug]/inbox/contacts": {
    eyebrow: "Contatos",
    title: "Base de contatos do workspace",
    description:
      "Construa a audiência que vai sustentar conversas, inbox, automações e futuras ações de CRM.",
  },
  "/workspace/[slug]/surveys": {
    eyebrow: "Surveys",
    title: "Diagnósticos públicos e captação",
    description:
      "Instale templates, publique quizzes e transforme tráfego em lead qualificado com contexto para o inbox.",
  },
  "/workspace/[slug]/lp": {
    eyebrow: "LPs",
    title: "Landing pages do workspace",
    description:
      "Crie, organize e refine landing pages para campanhas, iscas e captação de leads diretamente dentro do produto.",
  },
  "/workspace/[slug]/lp/create": {
    eyebrow: "LPs",
    title: "Criar landing page",
    description:
      "Monte a LP no editor visual drag-and-drop e refine o rascunho antes da publicação.",
  },
  "/workspace/[slug]/hooks": {
    eyebrow: "Iscas",
    title: "Iscas digitais e materiais de captação",
    description:
      "Organize ebooks, planilhas, checklists e outros materiais usados para atrair leads e enriquecer campanhas.",
  },
  "/workspace/[slug]/inbox": {
    eyebrow: "Inbox",
    title: "Operação de conversas",
    description:
      "Centralize o histórico por contato, distribua a operação e responda no canal certo.",
  },
  "/workspace/[slug]/inbox/messages": {
    eyebrow: "Mensagens",
    title: "Histórico de mensagens",
    description:
      "Acompanhe todas as mensagens enviadas e recebidas via WhatsApp, email e SMS.",
  },
  "/workspace/[slug]/settings/observability": {
    eyebrow: "Observabilidade",
    title: "Drilldowns e saúde operacional",
    description:
      "Explore métricas, erros e atividade por entidade para investigar a operação do workspace.",
  },
  "/workspace/[slug]/settings/rbac": {
    eyebrow: "RBAC",
    title: "Governança de acesso",
    description:
      "Administre roles globais, grants diretos e permissões efetivas do workspace.",
  },
};

type AppShellProps = {
  children: ReactNode;
  tenantSlug?: string;
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
  tenantSlug?: string;
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

function isNavItemActive(pathname: string, item: NavItem, slug: string) {
  const href = item.href.replace("[slug]", slug);

  if (item.match === "exact") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItemComponent({
  item,
  slug,
  collapsed,
  pathname,
  isLocked,
  layout = "default",
  isExpanded = false,
  onToggleChildren,
}: {
  item: NavItem;
  slug: string;
  collapsed: boolean;
  pathname: string;
  isLocked: boolean;
  layout?: "default" | "hero" | "child";
  isExpanded?: boolean;
  onToggleChildren?: () => void;
}) {
  const Icon = item.icon;
  const href = item.href.replace("[slug]", slug);
  const isActive = isNavItemActive(pathname, item, slug);
  const isChild = layout === "child";
  const isTopLevel = !isChild;
  const showToggle = !collapsed && !!item.hasChildren && !!onToggleChildren;

  const itemClassName = cn(
    "group relative flex w-full transition-all duration-200",
    collapsed
      ? "size-10 items-center justify-center"
      : isTopLevel
        ? "min-h-14 items-center gap-4 rounded-[1.6rem] px-5 py-3.5"
        : "min-h-12 items-center gap-3.5 rounded-[1.15rem] px-4 py-3",
    isTopLevel
      ? isActive
        ? "border border-foreground bg-foreground text-background shadow-[0_14px_30px_-22px_rgba(0,0,0,0.8)]"
        : "border border-border/70 bg-card text-foreground shadow-sm hover:border-foreground/10 hover:bg-card/95"
      : isActive
        ? "bg-background text-foreground shadow-sm"
        : "text-foreground hover:bg-background/80",
    isLocked && "opacity-50",
  );

  if (collapsed) {
    return (
      <Link
        href={href}
        className={itemClassName}
        title={isLocked ? `${item.title} · restrito` : item.title}
        aria-label={item.title}
      >
        <Icon className="size-4 shrink-0" />
      </Link>
    );
  }

  if (showToggle) {
    return (
      <div className={itemClassName}>
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-4"
          aria-current={isActive ? "page" : undefined}
        >
          <Icon className={cn("size-4 shrink-0")} />
          <span className="flex-1 truncate font-medium text-sm">
            {item.title}
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "-mr-1 h-8 w-8 rounded-full text-current hover:text-current",
            isActive
              ? "text-background/80 hover:bg-background/10"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
          onClick={onToggleChildren}
          aria-label={isExpanded ? "Fechar submenu" : "Abrir submenu"}
          title={isExpanded ? "Fechar submenu" : "Abrir submenu"}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </Button>
        {isLocked && (
          <Lock
            className={cn(
              "shrink-0",
              isTopLevel || isChild ? "size-4" : "size-3.5",
              isActive && isTopLevel
                ? "text-background/70"
                : "text-muted-foreground",
            )}
          />
        )}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={itemClassName}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate font-medium text-sm">{item.title}</span>
      {isLocked && (
        <Lock
          className={cn(
            "shrink-0",
            isTopLevel || isChild ? "size-4" : "size-3.5",
            isActive && isTopLevel
              ? "text-background/70"
              : "text-muted-foreground",
          )}
        />
      )}
    </Link>
  );
}

function NavGroupComponent({
  group,
  slug,
  collapsed,
  pathname,
  hasPermission,
}: {
  group: NavGroup;
  slug: string;
  collapsed: boolean;
  pathname: string;
  hasPermission: (permission?: string) => boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return group.items.some((item) => isNavItemActive(pathname, item, slug));
  });

  const visibleItems = group.items.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  if (visibleItems.length === 0) return null;

  const parentItem = visibleItems.find((item) => item.hasChildren);
  const childItems = visibleItems.filter((item) => item.children);
  const standaloneItems = visibleItems.filter(
    (item) => item !== parentItem && !item.children,
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        {visibleItems.map((item) => (
          <NavItemComponent
            key={item.href}
            item={item}
            slug={slug}
            collapsed={collapsed}
            pathname={pathname}
            isLocked={false}
          />
        ))}
      </div>
    );
  }

  if (group.title && parentItem && childItems.length > 0) {
    return (
      <div className="space-y-2.5">
        <div className="px-4 py-1 text-left text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
          {group.title}
        </div>

        <div className="space-y-2">
          {isExpanded ? (
            <div className="isolate flex flex-col items-center space-y-1.5">
              <div className="relative z-10 w-full">
                <NavItemComponent
                  item={parentItem}
                  slug={slug}
                  collapsed={collapsed}
                  pathname={pathname}
                  isLocked={false}
                  layout="hero"
                  isExpanded={isExpanded}
                  onToggleChildren={() => setIsExpanded(false)}
                />
              </div>
              <div className="relative z-0 -mt-3 w-[calc(100%-1.25rem)] rounded-[1.5rem] bg-secondary/70 px-3 pb-3 pt-4">
                <div className="flex flex-col gap-1.5">
                  {childItems.map((item) => (
                    <NavItemComponent
                      key={item.href}
                      item={item}
                      slug={slug}
                      collapsed={collapsed}
                      pathname={pathname}
                      isLocked={false}
                      layout="child"
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <NavItemComponent
              item={parentItem}
              slug={slug}
              collapsed={collapsed}
              pathname={pathname}
              isLocked={false}
              layout="hero"
              isExpanded={isExpanded}
              onToggleChildren={() => setIsExpanded(true)}
            />
          )}

          {standaloneItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {standaloneItems.map((item) => (
                <NavItemComponent
                  key={item.href}
                  item={item}
                  slug={slug}
                  collapsed={collapsed}
                  pathname={pathname}
                  isLocked={false}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {group.title && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-4 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
        >
          <span>{group.title}</span>
          {isExpanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      )}
      {(!group.title || isExpanded) && (
        <div className="flex flex-col gap-2">
          {visibleItems.map((item) => (
            <NavItemComponent
              key={item.href}
              item={item}
              slug={slug}
              collapsed={collapsed}
              pathname={pathname}
              isLocked={false}
              layout="default"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  collapsed = false,
  mobile = false,
  onCollapse,
  tenantSlug = "",
  tenantName,
  userEmail,
  userRole,
  userInitials = "U",
  onSignOut,
  signOutPending = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { hasTenantPermission, status: accessStatus } = useAccess();

  const hasPermission = (permission?: string) => {
    if (accessStatus !== "ready") return true;
    if (!permission) return true;
    return hasTenantPermission(permission);
  };

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

      <nav
        className={cn(
          "flex flex-col gap-6",
          collapsed ? "items-center" : undefined,
        )}
      >
        {navigationGroups.map((group, index) => (
          <NavGroupComponent
            key={group.title ?? `group-${index}`}
            group={group}
            slug={tenantSlug}
            collapsed={collapsed}
            pathname={pathname}
            hasPermission={hasPermission}
          />
        ))}
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
                >
                  <Avatar
                    size="sm"
                    className="pointer-events-none after:hidden"
                  >
                    <AvatarFallback className="bg-foreground text-xs font-medium text-background">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
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
              <DropdownMenuItem
                render={
                  <Link href={`/workspace/${tenantSlug}/settings/account`} />
                }
              >
                <Settings className="size-4" />
                Minha conta
              </DropdownMenuItem>
              {onSignOut ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={signOutPending}
                    onClick={() => void onSignOut()}
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
                  render={
                    <Link href={`/workspace/${tenantSlug}/settings/account`} />
                  }
                >
                  <Settings className="size-4" />
                  Minha conta
                </Button>
                {onSignOut ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={signOutPending}
                    onClick={() => void onSignOut()}
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
  tenantSlug,
  tenantName,
  userEmail,
  userRole,
  onSignOut,
  signOutPending = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getPageContent = () => {
    if (pageContentMap[pathname]) {
      return pageContentMap[pathname];
    }
    for (const [pattern] of Object.entries(pageContentMap)) {
      const patternParts = pathname.split("/").filter(Boolean);
      const mapParts = pattern.split("/").filter(Boolean);
      if (mapParts.length > 0 && patternParts.length >= mapParts.length) {
        let matches = true;
        for (let i = 0; i < mapParts.length; i++) {
          if (mapParts[i] !== patternParts[i] && mapParts[i] !== "[slug]") {
            matches = false;
            break;
          }
        }
        if (matches) {
          return pageContentMap[pattern];
        }
      }
    }
    return pageContentMap["/workspace/[slug]"];
  };

  const pageContent = getPageContent();
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
            tenantSlug={tenantSlug}
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
                          render={<Button variant="outline" size="icon-sm" />}
                          aria-label="Fechar menu lateral"
                          title="Fechar menu lateral"
                        >
                          <PanelLeftClose className="size-4" />
                        </SheetClose>
                      </div>
                    </SheetHeader>
                    <SheetBody className="thin-scrollbar p-4">
                      <SidebarContent
                        mobile
                        tenantSlug={tenantSlug}
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
