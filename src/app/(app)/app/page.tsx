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
      <Card className="grid gap-6 rounded-4xl bg-card shadow-md lg:grid-cols-[1.1fr_0.9fr] lg:p-2">
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
          <div className="space-y-4">
            <Badge variant="secondary">Workspace overview</Badge>
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
                  O frontend ainda não autentica nem chama dados reais. Mas a
                  base de integração já está pronta para isso entrar no próximo
                  slice.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Badge variant="secondary">Objetivo</Badge>
                <p className="text-sm leading-7 text-secondary-foreground">
                  Conectar login, sessão, guards e o primeiro dashboard usando
                  os contratos existentes do backend.
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
              O que já está pronto antes da autenticação
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
                      <ShieldCheck className="size-3.5" />
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
