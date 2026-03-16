"use client";

import {
  Activity,
  ChevronRight,
  Layers3,
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
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "Workspace",
    href: "/app",
    icon: Layers3,
    status: "ativo",
  },
  {
    title: "Times",
    href: "#",
    icon: UsersRound,
    status: "próximo",
  },
  {
    title: "Mensageria",
    href: "#",
    icon: MessageCircleMore,
    status: "próximo",
  },
  {
    title: "Observabilidade",
    href: "#",
    icon: Activity,
    status: "próximo",
  },
  {
    title: "RBAC",
    href: "#",
    icon: ShieldCheck,
    status: "próximo",
  },
] as const;

const pageContentMap = {
  "/app": {
    eyebrow: "Workspace",
    title: "Fundação do aplicativo",
    description:
      "A área autenticada já tem carcaça, navegação e integração base para os próximos módulos.",
  },
  "/app/user": {
    eyebrow: "Usuário",
    title: "Conta e preferências",
    description: "Gerencie a senha e os ajustes da sua conta autenticada.",
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

function SidebarContent({
  collapsed = false,
  mobile = false,
  onCollapse,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-6">
      <div
        className={cn(
          "flex items-center gap-3",
          collapsed ? "justify-center" : undefined,
        )}
      >
        <LurenessMark
          compact={collapsed}
          subtitle={mobile ? "Mobile Workspace" : "Application Workspace"}
        />
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
          const isActive =
            isNavigable &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const itemClassName = cn(
            "flex rounded-2xl border transition-colors",
            collapsed
              ? "size-12 items-center justify-center"
              : "items-center justify-between px-4 py-3",
            isActive
              ? "border-foreground/10 bg-foreground text-background shadow-sm"
              : "border-border/70 bg-background/75 text-foreground",
          );
          const iconNode = <Icon className="size-4 shrink-0" />;

          if (collapsed) {
            if (!isNavigable) {
              return (
                <div
                  key={item.title}
                  className={itemClassName}
                  title={item.title}
                >
                  {iconNode}
                </div>
              );
            }

            return (
              <Link
                key={item.title}
                href={item.href}
                className={itemClassName}
                title={item.title}
                aria-label={item.title}
              >
                {iconNode}
              </Link>
            );
          }

          const content = (
            <>
              <span className="flex items-center gap-3">
                {iconNode}
                <span className="text-sm font-medium">{item.title}</span>
              </span>
              <span className="pointer-events-none">
                <Badge variant={isActive ? "secondary" : "outline"}>
                  {item.status}
                </Badge>
              </span>
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
        <div className="mt-auto flex justify-center">
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
        <Card size="sm" className="mt-auto bg-card/85 shadow-sm">
          <CardContent className="grid gap-4 pt-3">
            <div className="space-y-2">
              <Badge variant="secondary">Estrutura</Badge>
              <p className="text-sm leading-6 text-muted-foreground">
                Shell, cliente HTTP e sessão local já estão prontos para receber
                auth, dashboard e workflows do produto.
              </p>
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
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pageContent =
    pageContentMap[pathname as keyof typeof pageContentMap] ??
    pageContentMap["/app"];
  const userInitials = getUserInitials(userEmail);

  return (
    <div className="page-frame min-h-screen">
      <div
        className={cn(
          "grid min-h-screen transition-[grid-template-columns] duration-300 ease-out",
          isSidebarCollapsed
            ? "lg:grid-cols-[96px_1fr]"
            : "lg:grid-cols-[288px_1fr]",
        )}
      >
        <aside
          className={cn(
            "surface-panel-strong hidden border-b border-border/70 p-5 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:rounded-none lg:border-r lg:border-b-0 lg:p-6",
            isSidebarCollapsed ? "lg:px-4" : undefined,
          )}
        >
          <SidebarContent
            collapsed={isSidebarCollapsed}
            onCollapse={() => setIsSidebarCollapsed(true)}
          />
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none absolute inset-0 bg-lureness-glow-dark opacity-80" />
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-15" />
          <header className="relative z-10 flex flex-col gap-3 border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur md:flex-row md:items-end md:justify-between lg:px-10">
            <div
              className={cn(
                "flex",
                isSidebarCollapsed ? "items-center gap-5" : "items-start gap-3",
              )}
            >
              <div className="lg:hidden">
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
                      <SidebarContent mobile />
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
              <div className="space-y-1">
                <p className="eyebrow">{pageContent.eyebrow}</p>
                <h1 className="font-serif text-3xl tracking-tight text-foreground">
                  {pageContent.title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {pageContent.description}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start">
              <ThemeToggle />
              {tenantName ? (
                <Badge variant="outline" className="gap-2 px-3 py-2 text-sm">
                  <span className="inline-flex size-2.5 rounded-full bg-chart-2" />
                  {tenantName}
                </Badge>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="size-11 rounded-full p-0"
                      aria-label="Abrir menu do usuário"
                      title="Abrir menu do usuário"
                    />
                  }
                >
                  <Avatar
                    size="lg"
                    className="pointer-events-none after:hidden"
                  >
                    <AvatarFallback className="bg-foreground text-sm font-medium text-background">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 min-w-72">
                  <DropdownMenuLabel>
                    <div className="grid gap-0.5 px-1 py-1">
                      <p className="text-sm font-medium text-foreground">
                        {userEmail ?? "Conta autenticada"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {userRole ?? "member"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/app/user")}>
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
            </div>
          </header>

          <main className="relative z-10 flex-1 px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
