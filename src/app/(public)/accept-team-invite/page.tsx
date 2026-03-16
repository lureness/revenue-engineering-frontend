import { Suspense } from "react";

import { AuthPublicLayout } from "@/components/auth/auth-public-layout";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { TeamInviteFlow } from "@/components/auth/team-invite-flow";

const inviteFeatures = [
  "Validação do token de invite emitido pela API.",
  "Handoff entre login e criação de conta conforme o e-mail convidado.",
  "Aceite do acesso ao time já conectado ao workspace.",
  "Entrada direta na área autenticada após concluir o fluxo.",
] as const;

function AcceptTeamInvitePageContent() {
  return (
    <AuthPublicLayout
      subtitle="Team invite"
      eyebrow="Invite"
      title={
        <>
          Entre em um time com um fluxo único para{" "}
          <span className="gradient-text">login ou criação de conta</span>.
        </>
      }
      description="Esta rota consome o token enviado por e-mail para decidir se você precisa entrar com uma conta existente ou criar uma nova conta a partir do invite."
      featureBadge="O que este fluxo cobre"
      features={inviteFeatures}
    >
      <TeamInviteFlow />
    </AuthPublicLayout>
  );
}

export default function AcceptTeamInvitePage() {
  return (
    <Suspense
      fallback={
        <AuthRouteState
          eyebrow="Invite"
          title="Preparando o invite de time"
          description="Estamos lendo o token enviado por e-mail para abrir o fluxo correto."
        />
      }
    >
      <AcceptTeamInvitePageContent />
    </Suspense>
  );
}
