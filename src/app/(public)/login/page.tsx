import { Suspense } from "react";

import { AuthPublicLayout } from "@/components/auth/auth-public-layout";
import { AuthRouteState } from "@/components/auth/auth-route-state";
import { LoginForm } from "@/components/auth/login-form";
import { PublicOnly } from "@/components/auth/public-only";

const authFeatures = [
  "Sessão protegida por cookies httpOnly.",
  "Redirecionamento automático para o workspace após login.",
  "Proteção da rota `/app` no cliente e no servidor.",
  "Logout com revogação de sessão no backend.",
  "Recuperação, redefinição e troca de senha já conectadas à API.",
] as const;

function LoginPageContent() {
  return (
    <PublicOnly>
      <AuthPublicLayout
        subtitle="Authentication"
        eyebrow="Frontend auth slice"
        title={
          <>
            O frontend agora já sabe{" "}
            <span className="gradient-text">entrar, proteger e sair</span>.
          </>
        }
        description="Este slice conecta o login real com a API, mantém a sessão em cookies seguros e abre o workspace apenas quando existir uma sessão válida."
        featureBadge="O que já entrou"
        features={authFeatures}
      >
        <LoginForm />
      </AuthPublicLayout>
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
