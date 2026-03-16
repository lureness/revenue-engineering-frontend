import { Suspense } from "react";

import { AuthPublicLayout } from "@/components/auth/auth-public-layout";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PublicOnly } from "@/components/auth/public-only";

const recoveryFeatures = [
  "Solicitação de link de redefinição direto contra a API.",
  "Mensagem segura que não revela se o e-mail existe.",
  "Compatível com o fluxo de token enviado por e-mail pelo backend.",
  "Reentrada no login logo após a redefinição da senha.",
] as const;

function ForgotPasswordPageContent() {
  return (
    <PublicOnly>
      <AuthPublicLayout
        subtitle="Password recovery"
        eyebrow="Recuperação de acesso"
        title={
          <>
            Recuperar a senha sem expor o estado{" "}
            <span className="gradient-text">da conta no frontend</span>.
          </>
        }
        description="A aplicação pede apenas o e-mail e delega à API a geração do token e o envio do link de redefinição."
        featureBadge="O que este fluxo cobre"
        features={recoveryFeatures}
      >
        <ForgotPasswordForm />
      </AuthPublicLayout>
    </PublicOnly>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Recuperação"
          title="Preparando a recuperação de senha"
          description="Estamos montando a rota pública e validando se já existe uma sessão ativa."
        />
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
