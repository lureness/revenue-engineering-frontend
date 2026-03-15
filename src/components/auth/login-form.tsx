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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

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
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a sessão.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
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

          <FieldError>{errorMessage}</FieldError>

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
