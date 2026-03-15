import {
  Activity,
  ChevronRight,
  KeyRound,
  Layers3,
  MessageCircleMore,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LurenessMark } from "@/components/brand/lureness-mark";
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
    title: "Autenticação",
    href: "#",
    icon: KeyRound,
    status: "próximo",
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

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="page-frame min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <aside className="surface-panel-strong border-b border-border/70 p-5 lg:sticky lg:top-0 lg:h-screen lg:rounded-none lg:border-r lg:border-b-0 lg:p-6">
          <div className="flex h-full flex-col gap-6">
            <LurenessMark subtitle="Application Workspace" />

            <div className="surface-panel grid gap-3 p-4">
              <p className="eyebrow">Ambiente</p>
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
            </div>

            <nav className="grid gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/app";
                const itemClassName = cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-foreground/10 bg-foreground text-background shadow-sm"
                    : "border-border/70 bg-background/75 text-foreground",
                );
                const content = (
                  <>
                    <span className="flex items-center gap-3">
                      <Icon className="size-4" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 font-mono text-[0.62rem] uppercase tracking-[0.18em]",
                        isActive
                          ? "bg-background/15 text-background/90"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.status}
                    </span>
                  </>
                );

                if (!isActive) {
                  return (
                    <div key={item.title} className={itemClassName}>
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={itemClassName}
                  >
                    {content}
                  </Link>
                );
              })}
            </nav>

            <div className="surface-panel mt-auto grid gap-4 p-4">
              <div className="space-y-1">
                <p className="eyebrow">Estrutura</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Shell, cliente HTTP e sessão local já estão prontos para
                  receber auth, dashboard e workflows do produto.
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Voltar para a landing
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <div className="pointer-events-none absolute inset-0 bg-lureness-glow-dark opacity-80" />
          <div className="pointer-events-none absolute inset-0 grid-fade opacity-15" />
          <header className="relative z-10 flex flex-col gap-3 border-b border-border/70 bg-background/80 px-6 py-5 backdrop-blur md:flex-row md:items-end md:justify-between lg:px-10">
            <div className="space-y-1">
              <p className="eyebrow">Workspace</p>
              <h1 className="font-serif text-3xl tracking-tight text-foreground">
                Fundação do aplicativo
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                A área autenticada já tem carcaça, navegação e integração base
                para os próximos módulos.
              </p>
            </div>
            <div className="surface-panel inline-flex items-center gap-2 self-start px-4 py-3 text-sm text-muted-foreground">
              <span className="inline-flex size-2.5 rounded-full bg-chart-2" />
              Próximo slice recomendado: autenticação e sessão real
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
