"use client";

import { CircleAlert, KeyRound, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { resetPassword } from "@/lib/auth/api";
import { isValidPasswordLength } from "@/lib/auth/validation";

function MissingResetTokenState() {
  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <CircleAlert className="size-5" />
        </div>
        <div className="space-y-3">
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            O link de redefinição está incompleto
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Abra novamente o e-mail enviado pela plataforma ou solicite um novo
            link de recuperação.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-6 pb-6 md:px-7 md:pb-7 sm:flex-row">
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/forgot-password" />}
        >
          Solicitar novo link
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/login" />}
        >
          Voltar para login
        </Button>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordFlow() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("O link de redefinição está incompleto.");
      return;
    }

    if (!isValidPasswordLength(newPassword)) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, newPassword);
      setIsSuccess(true);
      toast.success("Senha redefinida com sucesso.", {
        description: "Agora você já pode voltar ao login com a nova senha.",
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível redefinir a senha.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return <MissingResetTokenState />;
  }

  if (isSuccess) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <MailCheck className="size-5" />
          </div>
          <div className="space-y-3">
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Senha atualizada
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              A redefinição foi concluída. Faça login novamente com a nova senha
              para abrir o workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-6 pb-6 md:px-7 md:pb-7 sm:flex-row">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Ir para login
          </Button>
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Voltar para a landing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <KeyRound className="size-5" />
        </div>
        <div className="space-y-3">
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Definir uma nova senha
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Escolha uma nova senha para a sua conta. Este link só pode ser usado
            enquanto o token enviado por e-mail estiver válido.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="reset-password-new">Nova senha</FieldLabel>
            <FieldContent>
              <Input
                id="reset-password-new"
                type="password"
                autoComplete="new-password"
                placeholder="Crie uma nova senha"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="reset-password-confirm">
              Confirmar nova senha
            </FieldLabel>
            <FieldContent>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.currentTarget.value)
                }
              />
              <FieldDescription>
                A nova senha deve ter pelo menos 8 caracteres.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Redefinindo..." : "Salvar nova senha"}
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
