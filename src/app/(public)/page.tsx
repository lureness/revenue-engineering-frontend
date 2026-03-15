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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { publicEnv } from "@/lib/env";

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
            <Link href="/signup" className={secondaryActionClassName}>
              Criar conta
            </Link>
            <Link href="/login" className={secondaryActionClassName}>
              Entrar
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
              <Link href="/signup" className={primaryActionClassName}>
                Criar conta inicial
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/login" className={secondaryActionClassName}>
                Já tenho conta
              </Link>
            </div>

            <Card className="bg-card/85 shadow-sm">
              <CardContent className="grid gap-4 pt-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Badge variant="secondary">Rota pública</Badge>
                  <p className="text-sm font-medium text-foreground">`/`</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Landing, narrativa do produto e entrada principal.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary">Rota privada</Badge>
                  <p className="text-sm font-medium text-foreground">`/app`</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Shell preparado para dashboard, auth e módulos operacionais.
                  </p>
                </div>
                <div className="space-y-2">
                  <Badge variant="secondary">Base de API</Badge>
                  <p className="truncate font-mono text-xs text-foreground">
                    {publicEnv.apiBaseUrl}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Valor lido de `NEXT_PUBLIC_API_BASE_URL`.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4">
            <Card className="glow-border rounded-[2rem] bg-card shadow-md">
              <CardHeader>
                <div className="space-y-3">
                  <Badge variant="secondary">Pilares já suportados</Badge>
                  <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
                    Backend pronto para a interface
                  </CardTitle>
                </div>
                <CardAction>
                  <Badge variant="outline">v0 foundation</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-3">
                {productPillars.map((pillar) => {
                  const Icon = pillar.icon;

                  return (
                    <Card
                      key={pillar.title}
                      size="sm"
                      className="rounded-[1.4rem] bg-background/85"
                    >
                      <CardContent className="pt-3">
                        <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
                          <Icon className="size-4" />
                        </div>
                        <CardTitle className="mb-2 text-base font-semibold text-foreground">
                          {pillar.title}
                        </CardTitle>
                        <CardDescription className="leading-6">
                          {pillar.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-card/85 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 pt-4">
                <div className="space-y-2">
                  <Badge variant="secondary">Próximo passo</Badge>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Evoluir a área autenticada com módulos reais de times,
                    mensageria, observabilidade e governança.
                  </p>
                </div>
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Waypoints className="size-5" />
                </div>
              </CardContent>
            </Card>
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
              <Card key={block.title} className="bg-card/85 shadow-sm">
                <CardHeader>
                  <Badge variant="secondary">{block.eyebrow}</Badge>
                  <CardTitle className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                    {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-7">
                    {block.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Card
          id="backend"
          className="glow-border mb-6 rounded-[2rem] bg-card shadow-md"
        >
          <CardContent className="grid gap-5 pt-6 md:grid-cols-[0.95fr_1.05fr] md:p-8">
            <div className="space-y-3">
              <Badge variant="secondary">Integração</Badge>
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
              ].map((item, index, items) => (
                <Card key={item} size="sm" className="bg-background/80">
                  <CardContent className="pt-3">
                    <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                      <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                        <Layers3 className="size-3.5" />
                      </span>
                      <span>{item}</span>
                    </div>
                    {index < items.length - 1 ? (
                      <Separator className="mt-3 opacity-40" />
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
