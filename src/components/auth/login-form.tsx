"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import {
  formatApiErrorMessage,
  isApiErrorDetail,
} from "@/lib/api/error-messages";
import { resendVerificationEmail } from "@/lib/auth/api";
import { resolveSafeRedirectPath } from "@/lib/auth/navigation";

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value);
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Informe um e-mail válido.");
      setCanResendVerification(false);
      return;
    }

    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      setCanResendVerification(false);
      return;
    }

    setIsSubmitting(true);
    setCanResendVerification(false);

    try {
      await signIn({
        email: normalizedEmail,
        password,
      });

      startTransition(() => {
        router.replace(
          resolveSafeRedirectPath(searchParams.get("redirectTo"), "/app"),
        );
      });
    } catch (error) {
      setCanResendVerification(
        isApiErrorDetail(error, "email address is not verified"),
      );
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível iniciar a sessão.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      toast.error(
        "Informe o mesmo e-mail da conta para reenviar a verificação.",
      );
      return;
    }

    setIsResendingVerification(true);

    try {
      await resendVerificationEmail(normalizedEmail);
      toast.success("Enviamos um novo e-mail de verificação.", {
        description:
          "Abra a caixa de entrada e use apenas o link mais recente.",
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível reenviar o e-mail de verificação.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsResendingVerification(false);
    }
  }

  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <Badge variant="secondary" className="w-fit">
          Login
        </Badge>
        <div className="space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <KeyRound className="size-5" />
          </div>
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Entrar no workspace
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Use o e-mail e a senha do owner ou de um usuário já provisionado no
            backend para abrir a área autenticada.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
            <FieldContent>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <FieldDescription>
                O login usa apenas e-mail e senha.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="login-password">Senha</FieldLabel>
            <FieldContent>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
              <FieldDescription>
                Se a sessão expirar, o frontend usa o refresh token localmente.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="min-w-[12rem]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/" />}
            >
              Voltar para a landing
            </Button>
          </div>

          {canResendVerification ? (
            <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                Sua conta existe, mas o e-mail ainda não foi confirmado.
              </p>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification
                    ? "Reenviando..."
                    : "Reenviar e-mail de verificação"}
                </Button>
              </div>
            </div>
          ) : null}

          <p className="text-sm leading-6 text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              Criar workspace inicial
            </Link>
            .
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
