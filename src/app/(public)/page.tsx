import {
  Activity,
  ArrowRight,
  Layers3,
  MessageSquareMore,
  ShieldCheck,
  UsersRound,
  Waypoints,
} from "lucide-react";
import Link from "next/link";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";

const primaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform duration-200 hover:-translate-y-0.5";

const secondaryActionClassName =
  "inline-flex items-center justify-center gap-2 rounded-full border border-foreground/15 bg-card/80 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const productPillars = [
  {
    title: "Autenticação multitenant",
    description:
      "Onboarding de tenant, sessões, verificação de e-mail, reset de senha e convites já prontos no backend.",
    icon: ShieldCheck,
  },
  {
    title: "Times e governança",
    description:
      "Memberships, roles, grants customizados e RBAC já modelados para crescer com o produto.",
    icon: UsersRound,
  },
  {
    title: "WhatsApp como motor",
    description:
      "Providers, senders, inbound, status callbacks e trilha de mensagens para operação de ponta a ponta.",
    icon: MessageSquareMore,
  },
  {
    title: "Observabilidade de produto",
    description:
      "Logs, métricas, dashboards e drilldowns por domínio para operar o SaaS com clareza.",
    icon: Activity,
  },
] as const;

const foundationBlocks = [
  {
    eyebrow: "Público",
    title: "Landing pública em /",
    description:
      "A homepage agora fica livre para posicionamento, documentação comercial e entrada de leads.",
  },
  {
    eyebrow: "Privado",
    title: "Shell em /app",
    description:
      "A área autenticada já tem navegação, topbar e espaço preparado para os módulos reais.",
  },
  {
    eyebrow: "Data Layer",
    title: "Cliente HTTP e sessão local",
    description:
      "A integração com o backend já tem base de env, request client e persistência local de tokens.",
  },
] as const;

export default function LandingPage() {
  return (
    <main className="page-frame bg-lureness-glow">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 pb-10 md:flex-row md:items-center md:justify-between">
          <LurenessMark />

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#foundation"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Fundação
            </a>
            <a
              href="#backend"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Backend pronto
            </a>
            <Link href="/app" className={secondaryActionClassName}>
              Abrir workspace
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 pb-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="space-y-8">
            <div className="space-y-5">
              <p className="eyebrow">Frontend foundation slice</p>
              <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
                Uma superfície única para{" "}
                <span className="gradient-text">operações em WhatsApp</span>,
                times, permissões e observabilidade.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                O backend já consolidou autenticação, mensageria, RBAC e
                dashboards. Agora o frontend passa a ter uma base real para
                receber esses domínios com clareza de navegação e integração.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/app" className={primaryActionClassName}>
                Entrar no workspace
                <ArrowRight className="size-4" />
              </Link>
              <a href="#foundation" className={secondaryActionClassName}>
                Ver a estrutura
              </a>
            </div>

            <div className="surface-panel grid gap-4 p-5 md:grid-cols-3">
              <div className="space-y-1">
                <p className="eyebrow">Rota pública</p>
                <p className="text-sm font-medium text-foreground">`/`</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Landing, narrativa do produto e entrada principal.
                </p>
              </div>
              <div className="space-y-1">
                <p className="eyebrow">Rota privada</p>
                <p className="text-sm font-medium text-foreground">`/app`</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Shell preparado para dashboard, auth e módulos operacionais.
                </p>
              </div>
              <div className="space-y-1">
                <p className="eyebrow">Base de API</p>
                <p className="truncate font-mono text-xs text-foreground">
                  {publicEnv.apiBaseUrl}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Valor lido de `NEXT_PUBLIC_API_BASE_URL`.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="surface-panel-strong glow-border rounded-[2rem] p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="eyebrow">Pilares já suportados</p>
                  <h2 className="font-serif text-3xl tracking-tight text-foreground">
                    Backend pronto para a interface
                  </h2>
                </div>
                <div className="rounded-full border border-border/70 bg-secondary px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-secondary-foreground">
                  v0 foundation
                </div>
              </div>

              <div className="grid gap-3">
                {productPillars.map((pillar) => {
                  const Icon = pillar.icon;

                  return (
                    <div
                      key={pillar.title}
                      className="rounded-[1.4rem] border border-border/70 bg-background/85 p-4"
                    >
                      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                        <Icon className="size-4" />
                      </div>
                      <h3 className="mb-2 text-base font-semibold text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {pillar.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="surface-panel flex items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-1">
                <p className="eyebrow">Próximo passo</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Implementar autenticação real em cima da base de sessão e do
                  shell.
                </p>
              </div>
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Waypoints className="size-5" />
              </div>
            </div>
          </div>
        </section>

        <section
          id="foundation"
          className="grid gap-5 border-t border-border/70 py-14"
        >
          <div className="max-w-2xl space-y-3">
            <p className="eyebrow">Estrutura do app</p>
            <h2 className="section-title">
              O frontend já foi separado entre superfície pública, shell privado
              e data layer.
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {foundationBlocks.map((block) => (
              <article key={block.title} className="surface-panel p-6">
                <p className="eyebrow">{block.eyebrow}</p>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                  {block.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {block.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="backend"
          className="surface-panel-strong glow-border mb-6 grid gap-5 rounded-[2rem] p-6 md:grid-cols-[0.95fr_1.05fr] md:p-8"
        >
          <div className="space-y-3">
            <p className="eyebrow">Integração</p>
            <h2 className="section-title text-3xl md:text-4xl">
              A API já dita o ritmo do produto.
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Auth, teams, invites, mensageria, providers, senders e
              observability já existem no backend. O frontend agora tem uma
              fundação limpa para começar a consumir esses contratos sem
              improviso.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              "Cliente HTTP centralizado com tratamento de erro e request id.",
              "Sessão local preparada para access token, refresh token, tenant e usuário.",
              "Shell pronto para módulos autenticados e navegação futura.",
            ].map((item) => (
              <div
                key={item}
                className={cn(
                  "flex items-start gap-3 rounded-[1.3rem] border border-border/70 bg-background/80 px-4 py-4 text-sm leading-6 text-muted-foreground",
                )}
              >
                <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <Layers3 className="size-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
