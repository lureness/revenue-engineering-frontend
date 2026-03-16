import {
  Activity,
  ArrowRight,
  KeyRound,
  MessageSquareMore,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { publicEnv } from "@/lib/env";

const nextModules = [
  {
    title: "Times",
    description:
      "O próximo passo natural é transformar memberships, roles e invites em UI operacional.",
    icon: UsersRound,
  },
  {
    title: "Mensageria",
    description:
      "Providers, senders, inbound e status callbacks já estão prontos para telas de operação.",
    icon: MessageSquareMore,
  },
  {
    title: "Observabilidade",
    description:
      "Dashboards e drilldowns já existem. Falta transformar isso em leitura visual do produto.",
    icon: Activity,
  },
  {
    title: "Governança",
    description:
      "RBAC, grants customizados e permissões efetivas já estão modelados para o painel.",
    icon: ShieldCheck,
  },
] as const;

const foundationChecklist = [
  "Sessão local com access token, refresh token e expiração controlada.",
  "Rota `/app` protegida por guard do lado do cliente.",
  "Login real contra `/auth/login` com persistência local.",
  "Logout conectado ao backend com revogação de sessão.",
  "Verificação, recuperação e troca de senha conectadas à API.",
] as const;

export default function WorkspacePage() {
  return (
    <div className="grid gap-6">
      <Card className="grid gap-6 rounded-4xl bg-card shadow-md lg:grid-cols-[1.1fr_0.9fr] lg:p-2">
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
          <div className="space-y-4">
            <Badge variant="secondary">Workspace overview</Badge>
            <h2 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              O aplicativo já autentica e abre a área privada com sessão real.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              A fundação do frontend agora já conhece o backend de auth. O
              próximo passo é transformar os demais domínios em fluxos
              operacionais dentro do workspace.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/user"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
              >
                Abrir área do usuário
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Voltar para a landing
              </Link>
            </div>
          </div>

          <Card className="bg-background/70">
            <CardContent className="grid gap-3 pt-4">
              <div className="space-y-2">
                <Badge variant="secondary">API base</Badge>
                <p className="truncate font-mono text-sm text-foreground">
                  {publicEnv.apiBaseUrl}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Badge variant="outline">Estado atual</Badge>
                <p className="text-sm leading-7 text-muted-foreground">
                  O login e a proteção da rota privada já estão conectados. O
                  núcleo de autenticação agora está completo e o próximo uso
                  real da API pode entrar por módulos como teams, invites,
                  observabilidade e mensageria.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Badge variant="secondary">Objetivo</Badge>
                <p className="text-sm leading-7 text-secondary-foreground">
                  Evoluir a área autenticada para dashboards, operações e
                  governança em cima da sessão já conectada.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary">Checklist da fundação</Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              O que já está pronto no núcleo de acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {foundationChecklist.map((item) => (
              <Card
                key={item}
                size="sm"
                className="rounded-[1.2rem] bg-background/85"
              >
                <CardContent className="pt-3">
                  <div className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                    <span className="mt-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-chart-2 text-background">
                      <KeyRound className="size-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {nextModules.map((module) => {
            const Icon = module.icon;

            return (
              <Card key={module.title} className="bg-card/85 shadow-sm">
                <CardHeader>
                  <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-foreground text-background">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-7">
                    {module.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
