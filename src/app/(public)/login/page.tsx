import { Suspense } from "react";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { LoginForm } from "@/components/auth/login-form";
import { PublicOnly } from "@/components/auth/public-only";
import { LurenessMark } from "@/components/brand/lureness-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const authFeatures = [
  "Sessão local com access token e refresh token.",
  "Redirecionamento automático para o workspace após login.",
  "Proteção da rota `/app` no cliente.",
  "Logout com revogação de sessão no backend.",
] as const;

function LoginPageContent() {
  return (
    <PublicOnly>
      <main className="page-frame bg-lureness-glow">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="pb-10">
            <LurenessMark subtitle="Authentication" />
          </header>

          <section className="grid flex-1 items-center gap-8 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="eyebrow">Frontend auth slice</p>
                <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl">
                  O frontend agora já sabe{" "}
                  <span className="gradient-text">entrar, proteger e sair</span>
                  .
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                  Este primeiro slice conecta o login real com a API, persiste a
                  sessão localmente e abre o workspace apenas quando existir uma
                  sessão válida.
                </p>
              </div>

              <Card className="bg-card/85 shadow-sm">
                <CardContent className="grid gap-3 pt-4">
                  <Badge variant="secondary" className="w-fit">
                    O que já entrou
                  </Badge>
                  {authFeatures.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3 text-sm leading-6 text-muted-foreground"
                    >
                      {feature}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <LoginForm />
          </section>
        </div>
      </main>
    </PublicOnly>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Autenticação"
          title="Preparando a tela de login"
          description="Estamos montando a rota pública e validando o redirecionamento inicial."
        />
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
