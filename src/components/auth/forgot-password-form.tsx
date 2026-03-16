"use client";

import { ArrowRight, LifeBuoy, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { forgotPassword } from "@/lib/auth/api";
import { isValidEmail } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword(normalizedEmail);
      setSubmittedEmail(normalizedEmail);
      toast.success("Se existir uma conta com esse e-mail, enviamos o link.", {
        description:
          "Abra a caixa de entrada e use apenas o link mais recente para redefinir a senha.",
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível enviar o link de recuperação.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedEmail) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <MailCheck className="size-5" />
          </div>
          <div className="space-y-3">
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Confira a sua caixa de entrada
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              Se o e-mail{" "}
              <strong className="text-foreground">{submittedEmail}</strong>{" "}
              estiver cadastrado, o backend já enviou o link de redefinição.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 px-6 pb-6 md:px-7 md:pb-7">
          <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4 text-sm leading-6 text-muted-foreground">
            Use apenas o link mais recente. Quando a senha for redefinida, você
            poderá voltar ao login normalmente.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                setEmail(submittedEmail);
                setSubmittedEmail("");
              }}
            >
              Enviar novamente
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Voltar para login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <LifeBuoy className="size-5" />
        </div>
        <div className="space-y-3">
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Recuperar acesso ao workspace
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Informe o e-mail da conta. Se ele existir, a API enviará um link
            para redefinir a senha.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="forgot-password-email">E-mail</FieldLabel>
            <FieldContent>
              <Input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <FieldDescription>
                O fluxo não expõe se o e-mail existe ou não no sistema.
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
              {isSubmitting ? "Enviando..." : "Enviar link"}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Voltar para login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
