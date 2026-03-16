"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { isUnauthorizedError } from "@/components/auth/auth-provider";
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
import { changePassword } from "@/lib/auth/api";
import { isValidPasswordLength } from "@/lib/auth/validation";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function redirectToLogin(reason: string) {
    window.location.replace(`/login?reason=${reason}`);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidPasswordLength(currentPassword)) {
      toast.error("Informe a sua senha atual completa.");
      return;
    }

    if (!isValidPasswordLength(newPassword)) {
      toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("A nova senha precisa ser diferente da senha atual.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Senha alterada com sucesso.", {
        description:
          "Por segurança, você vai precisar entrar novamente com a nova senha.",
      });
      redirectToLogin("password-changed");
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast.error("Sua sessão expirou.", {
          description: "Faça login novamente para continuar.",
        });
        redirectToLogin("session-expired");
        return;
      }

      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível alterar a senha.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full glow-border rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-3">
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Alterar senha
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Ao concluir a troca, o backend revoga todas as sessões abertas e a
            aplicação pede um novo login com a senha atualizada.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="current-password">Senha atual</FieldLabel>
            <FieldContent>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                placeholder="Informe a senha atual"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.currentTarget.value)
                }
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password">Nova senha</FieldLabel>
            <FieldContent>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Crie a nova senha"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="new-password-confirm">
              Confirmar nova senha
            </FieldLabel>
            <FieldContent>
              <Input
                id="new-password-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.currentTarget.value)
                }
              />
              <FieldDescription>
                Use uma senha com pelo menos 8 caracteres e diferente da atual.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Salvar nova senha"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              Limpar campos
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
