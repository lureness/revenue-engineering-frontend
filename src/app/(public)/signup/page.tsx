import { Suspense } from "react";

import { AuthPublicLayout } from "@/components/auth/auth-public-layout";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { PublicOnly } from "@/components/auth/public-only";
import { SignupForm } from "@/components/auth/signup-form";

const onboardingFeatures = [
  "Criação do workspace e do owner iniciais em uma única etapa.",
  "Sugestão automática de slug compatível com a API.",
  "Confirmação de senha antes do bootstrap.",
  "Reenvio do e-mail de verificação após o onboarding.",
] as const;

function SignupPageContent() {
  return (
    <PublicOnly>
      <AuthPublicLayout
        subtitle="Initial onboarding"
        eyebrow="Public onboarding slice"
        title={
          <>
            Crie o workspace inicial e comece com a base{" "}
            <span className="gradient-text">multitenant da Lureness</span>.
          </>
        }
        description="O frontend agora já conversa com o bootstrap da API e conduz o primeiro cadastro até o estado de verificação de e-mail."
        featureBadge="O que este fluxo cobre"
        features={onboardingFeatures}
      >
        <SignupForm />
      </AuthPublicLayout>
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
