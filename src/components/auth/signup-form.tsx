"use client";

import { ArrowRight, Building2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  type BootstrapTenantPayload,
  bootstrapTenant,
  resendVerificationEmail,
} from "@/lib/auth/api";
import { isValidTenantSlug, slugifyTenantName } from "@/lib/auth/onboarding";
import { isValidEmail, isValidPasswordLength } from "@/lib/auth/validation";

type BootstrapSuccessState = {
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
  };
};

export function SignupForm() {
  const [tenantName, setTenantName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [createdAccount, setCreatedAccount] =
    useState<BootstrapSuccessState | null>(null);

  useEffect(() => {
    if (slugManuallyEdited) {
      return;
    }

    setTenantSlug(slugifyTenantName(tenantName));
  }, [slugManuallyEdited, tenantName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTenantName = tenantName.trim();
    const normalizedTenantSlug = slugifyTenantName(tenantSlug);
    const normalizedEmail = adminEmail.trim().toLowerCase();

    if (normalizedTenantName.length < 2) {
      toast.error("Informe um nome de workspace com pelo menos 2 caracteres.");
      return;
    }

    if (!isValidTenantSlug(normalizedTenantSlug)) {
      toast.error(
        "Use um slug com 3 a 100 caracteres, apenas letras minúsculas, números e hífens.",
      );
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      toast.error("Informe um e-mail válido.");
      return;
    }

    if (!isValidPasswordLength(adminPassword)) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (adminPassword !== confirmPassword) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: BootstrapTenantPayload = {
        tenant_name: normalizedTenantName,
        tenant_slug: normalizedTenantSlug,
        admin_email: normalizedEmail,
        admin_password: adminPassword,
      };

      const result = await bootstrapTenant(payload);

      setCreatedAccount({
        tenant: result.tenant,
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      });
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível criar a conta inicial.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!createdAccount) {
      return;
    }

    setIsResendingEmail(true);

    try {
      await resendVerificationEmail(createdAccount.user.email);
      toast.success("Enviamos um novo e-mail de verificação.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível reenviar o e-mail de verificação.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsResendingEmail(false);
    }
  }

  if (createdAccount) {
    return (
      <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
        <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
          <Badge variant="secondary" className="w-fit">
            Conta criada
          </Badge>
          <div className="space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
              <MailCheck className="size-5" />
            </div>
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Falta verificar o seu e-mail
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              O workspace inicial já foi criado, mas o login só será liberado
              depois que você confirmar o endereço de e-mail enviado para o
              owner.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-5 px-6 pb-6 md:px-7 md:pb-7">
          <Card className="rounded-[1.4rem] bg-background/85">
            <CardContent className="grid gap-3 pt-4">
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Workspace
                </p>
                <p className="text-sm font-medium text-foreground">
                  {createdAccount.tenant.name}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {createdAccount.tenant.slug}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  Owner
                </p>
                <p className="text-sm font-medium text-foreground">
                  {createdAccount.user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              size="lg"
              onClick={handleResendVerification}
              disabled={isResendingEmail}
            >
              {isResendingEmail
                ? "Reenviando..."
                : "Reenviar e-mail de verificação"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Ir para login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glow-border w-full rounded-[2rem] bg-card shadow-md">
      <CardHeader className="gap-3 px-6 pt-6 md:px-7 md:pt-7">
        <Badge variant="secondary" className="w-fit">
          Onboarding
        </Badge>
        <div className="space-y-3">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <Building2 className="size-5" />
          </div>
          <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
            Criar o workspace inicial
          </CardTitle>
          <CardDescription className="text-sm leading-7">
            Este fluxo cria o workspace e a conta owner iniciais. Depois disso,
            o backend envia o link de verificação por e-mail.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 md:px-7 md:pb-7">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="tenant-name">Nome do workspace</FieldLabel>
            <FieldContent>
              <Input
                id="tenant-name"
                autoComplete="organization"
                placeholder="Basix Digital"
                value={tenantName}
                onChange={(event) => setTenantName(event.currentTarget.value)}
              />
              <FieldDescription>
                Esse nome aparece como identidade principal do workspace.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="tenant-slug">Slug do workspace</FieldLabel>
            <FieldContent>
              <Input
                id="tenant-slug"
                autoComplete="off"
                placeholder="basix-digital"
                value={tenantSlug}
                onChange={(event) => {
                  setSlugManuallyEdited(true);
                  setTenantSlug(slugifyTenantName(event.currentTarget.value));
                }}
              />
              <FieldDescription>
                Usado como identificador estável. Só aceita minúsculas, números
                e hífens.
              </FieldDescription>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="admin-email">E-mail do owner</FieldLabel>
            <FieldContent>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                placeholder="owner@empresa.com"
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.currentTarget.value)}
              />
              <FieldDescription>
                Esse usuário receberá o e-mail de verificação inicial.
              </FieldDescription>
            </FieldContent>
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="admin-password">Senha</FieldLabel>
              <FieldContent>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Crie uma senha"
                  value={adminPassword}
                  onChange={(event) =>
                    setAdminPassword(event.currentTarget.value)
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirmar senha
              </FieldLabel>
              <FieldContent>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                />
              </FieldContent>
            </Field>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="min-w-[12rem]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando..." : "Criar conta"}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Já tenho conta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
