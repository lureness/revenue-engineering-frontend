import { Suspense } from "react";

import { AuthRouteState } from "@/components/auth/auth-route-state";
import { VerifyEmailFlow } from "@/components/auth/verify-email-flow";

function VerifyEmailPageContent() {
  return <VerifyEmailFlow />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Verificação"
          title="Preparando a confirmação do e-mail"
          description="Estamos montando a rota pública e lendo o token enviado no link."
        />
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
