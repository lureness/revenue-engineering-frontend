import { Suspense } from "react";

import { AuthPublicLayout } from "@/components/auth/auth-public-layout";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { ResetPasswordFlow } from "@/components/auth/reset-password-flow";

const resetFeatures = [
  "Consumo do token emitido pela API por query string.",
  "Validação de confirmação da nova senha antes da requisição.",
  "Tratamento amigável para link expirado, inválido ou incompleto.",
  "Handoff direto de volta para o login após redefinir a senha.",
] as const;

function ResetPasswordPageContent() {
  return (
    <AuthPublicLayout
      subtitle="Password reset"
      eyebrow="Redefinição"
      title={
        <>
          Conclua a recuperação com um link seguro e{" "}
          <span className="gradient-text">uma nova senha válida</span>.
        </>
      }
      description="Esta rota consome o token vindo do e-mail do backend e finaliza a redefinição da senha antes do próximo login."
      featureBadge="O que este fluxo cobre"
      features={resetFeatures}
    >
      <ResetPasswordFlow />
    </AuthPublicLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Redefinição"
          title="Preparando a redefinição de senha"
          description="Estamos lendo o token enviado no link para concluir a recuperação da conta."
        />
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
