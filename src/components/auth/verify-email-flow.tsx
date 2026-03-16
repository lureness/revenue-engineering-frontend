"use client";

import { CircleAlert, Loader2, MailCheck, RotateCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { verifyEmailToken } from "@/lib/auth/api";

type VerificationStatus = "verifying" | "success" | "error" | "missing-token";

type VerificationState = {
  status: VerificationStatus;
  title: string;
  description: string;
};

const pendingVerificationRequests = new Map<string, Promise<void>>();

function verifyTokenOnce(token: string) {
  const existingRequest = pendingVerificationRequests.get(token);

  if (existingRequest) {
    return existingRequest;
  }

  const request = verifyEmailToken(token).finally(() => {
    pendingVerificationRequests.delete(token);
  });

  pendingVerificationRequests.set(token, request);
  return request;
}

function getStateIcon(status: VerificationStatus) {
  switch (status) {
    case "success":
      return <MailCheck className="size-6" />;
    case "error":
    case "missing-token":
      return <CircleAlert className="size-6" />;
    default:
      return <Loader2 className="size-6 animate-spin" />;
  }
}

export function VerifyEmailFlow() {
  const searchParams = useSearchParams();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<VerificationState>({
    status: "verifying",
    title: "Validando o link de verificação",
    description: "Estamos confirmando o seu endereço de e-mail com a API.",
  });

  const token = searchParams.get("token")?.trim() ?? "";

  useEffect(() => {
    const isRetryAttempt = attempt > 0;

    if (!token) {
      setState({
        status: "missing-token",
        title: "O link de verificação está incompleto.",
        description:
          "Abra novamente o e-mail enviado pela plataforma ou solicite um novo link de verificação.",
      });
      return;
    }

    let cancelled = false;

    setState({
      status: "verifying",
      title: isRetryAttempt
        ? "Tentando validar o link novamente"
        : "Validando o link de verificação",
      description: isRetryAttempt
        ? "Estamos tentando confirmar o seu endereço de e-mail mais uma vez."
        : "Estamos confirmando o seu endereço de e-mail com a API.",
    });

    void verifyTokenOnce(token)
      .then(() => {
        if (cancelled) {
          return;
        }

        setState({
          status: "success",
          title: "E-mail verificado com sucesso.",
          description:
            "Sua conta já pode entrar no workspace. Agora você pode voltar ao login e iniciar a sessão normalmente.",
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível verificar o e-mail.",
        });

        setState({
          status: "error",
          title: presentation.title,
          description:
            presentation.description ??
            "Se necessário, solicite um novo e-mail de verificação e use apenas o link mais recente.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, token]);

  return (
    <main className="page-frame bg-lureness-glow">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 pb-10">
          <LurenessMark subtitle="Email verification" />
          <ThemeToggle />
        </header>

        <section className="flex flex-1 items-center justify-center pb-10">
          <Card className="glow-border w-full max-w-2xl rounded-[2rem] bg-card shadow-md">
            <CardHeader className="gap-4 px-6 pt-6 md:px-7 md:pt-7">
              <Badge variant="secondary" className="w-fit">
                Verificação
              </Badge>
              <div className="space-y-4">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background">
                  {getStateIcon(state.status)}
                </div>
                <div className="space-y-3">
                  <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
                    {state.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-7">
                    {state.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 px-6 pb-6 md:px-7 md:pb-7">
              <div className="flex flex-col gap-3 sm:flex-row">
                {state.status === "success" ? (
                  <Button
                    size="lg"
                    nativeButton={false}
                    render={<Link href="/login" />}
                  >
                    Ir para o login
                  </Button>
                ) : null}

                {state.status === "error" && token ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() =>
                      setAttempt((currentValue) => currentValue + 1)
                    }
                  >
                    <RotateCw className="size-4" />
                    Tentar novamente
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={
                    <Link href={state.status === "success" ? "/" : "/signup"} />
                  }
                >
                  {state.status === "success"
                    ? "Voltar para a landing"
                    : "Voltar para o onboarding"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
