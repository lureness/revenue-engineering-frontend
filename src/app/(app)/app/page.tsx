import {
  Activity,
  ArrowRight,
  KeyRound,
  MessageSquareMore,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { publicEnv } from "@/lib/env";

const nextModules = [
  {
    title: "Autenticação",
    description:
      "Login, onboarding, verify-email e recuperação de senha podem entrar agora sem refazer a fundação.",
    icon: KeyRound,
  },
  {
    title: "Times",
    description:
      "O backend já suporta times, invites e memberships. Falta só traduzir isso em UI operacional.",
    icon: UsersRound,
  },
  {
    title: "Mensageria",
    description:
      "Providers, senders, inbound e status callbacks já estão modelados para virar telas de operação.",
    icon: MessageSquareMore,
  },
  {
    title: "Observabilidade",
    description:
      "Dashboards e drilldowns já existem. O próximo passo é materializar essas visões no frontend.",
    icon: Activity,
  },
] as const;

const foundationChecklist = [
  "Rota pública em `/` para landing e posicionamento do produto.",
  "Shell reutilizável em `/app` para a área autenticada.",
  "Base de env pública com `NEXT_PUBLIC_API_BASE_URL`.",
  "Cliente HTTP único com tratamento central de erro.",
  "Persistência local de sessão pronta para o próximo slice.",
] as const;

export default function WorkspacePage() {
  return (
    <div className="grid gap-6">
      <section className="surface-panel-strong grid gap-6 rounded-4xl p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-4">
          <p className="eyebrow">Workspace overview</p>
          <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
            O aplicativo já tem carcaça para receber o backend.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Este espaço existe para receber autenticação, dashboard, gestão de
            times, mensageria e observabilidade sem retrabalho estrutural.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Voltar para a landing
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background">
              Próximo passo: autenticação
              <ArrowRight className="size-4" />
            </div>
          </div>
        </div>

        <div className="surface-panel grid gap-3 p-5">
          <div className="space-y-1">
            <p className="eyebrow">API base</p>
            <p className="truncate font-mono text-sm text-foreground">
              {publicEnv.apiBaseUrl}
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-background/90 p-4">
            <p className="eyebrow">Estado atual</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              O frontend ainda não autentica nem chama dados reais. Mas a base
              de integração já está pronta para isso entrar no próximo slice.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-border/70 bg-secondary/50 p-4">
            <p className="eyebrow">Objetivo</p>
            <p className="mt-2 text-sm leading-7 text-secondary-foreground">
              Conectar login, sessão, guards e o primeiro dashboard usando os
              contratos existentes do backend.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-panel p-6">
          <p className="eyebrow">Checklist da fundação</p>
          <div className="mt-4 grid gap-3">
            {foundationChecklist.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-chart-2 text-background">
                  <ShieldCheck className="size-3.5" />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {nextModules.map((module) => {
            const Icon = module.icon;

            return (
              <article key={module.title} className="surface-panel p-6">
                <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                  {module.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {module.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
