import { Suspense } from "react";

import { AuthRouteState } from "@/components/auth/auth-route-state";
import { PublicOnly } from "@/components/auth/public-only";
import { SignupForm } from "@/components/auth/signup-form";
import { LurenessMark } from "@/components/brand/lureness-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const onboardingFeatures = [
  "Criação do tenant e do owner iniciais em uma única etapa.",
  "Sugestão automática de slug compatível com a API.",
  "Confirmação de senha antes do bootstrap.",
  "Reenvio do e-mail de verificação após o onboarding.",
] as const;

function SignupPageContent() {
  return (
    <PublicOnly>
      <main className="page-frame bg-lureness-glow">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
          <header className="pb-10">
            <LurenessMark subtitle="Initial onboarding" />
          </header>

          <section className="grid flex-1 items-center gap-8 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="eyebrow">Public onboarding slice</p>
                <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl">
                  Crie o tenant inicial e comece com a base{" "}
                  <span className="gradient-text">multitenant da Lureness</span>
                  .
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                  O frontend agora já conversa com o bootstrap da API e conduz o
                  primeiro cadastro até o estado de verificação de e-mail.
                </p>
              </div>

              <Card className="bg-card/85 shadow-sm">
                <CardContent className="grid gap-3 pt-4">
                  <Badge variant="secondary" className="w-fit">
                    O que este fluxo cobre
                  </Badge>
                  {onboardingFeatures.map((feature) => (
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

            <SignupForm />
          </section>
        </div>
      </main>
    </PublicOnly>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Onboarding"
          title="Preparando o cadastro inicial"
          description="Estamos montando a rota pública e validando se já existe uma sessão ativa."
        />
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
