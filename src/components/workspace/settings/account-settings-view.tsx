"use client";

import { Building2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AccountSettingsViewProps = {
  tenantSlug: string;
};

const accountMenuItems = [
  {
    id: "password",
    label: "Alterar senha",
    description: "Atualize a senha da conta autenticada.",
    icon: KeyRound,
  },
] as const;

function InfoCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Mail;
}) {
  return (
    <Card className="bg-card/85 shadow-sm">
      <CardContent className="grid gap-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{label}</Badge>
          <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-foreground text-background">
            <Icon className="size-4" />
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountSettingsView({ tenantSlug }: AccountSettingsViewProps) {
  const { tenant, user } = useAuth();

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Configuração
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Minha conta
            </CardTitle>
            <CardDescription className="leading-7">
              Dados da sessão autenticada e atalhos de segurança da conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {accountMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={`/workspace/${tenantSlug}/settings/account#${item.id}`}
                  className="rounded-[1.2rem] border border-foreground/10 bg-foreground px-4 py-3 text-background shadow-sm transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/12">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-background/80">
                        {item.description}
                      </span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      <div className="grid gap-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard
            label="E-mail"
            value={user?.email ?? "Conta autenticada"}
            description="Identidade principal usada para entrar no produto."
            icon={Mail}
          />
          <InfoCard
            label="Role"
            value={user?.role ?? "member"}
            description="Papel atual da sua conta dentro do workspace."
            icon={ShieldCheck}
          />
          <InfoCard
            label="Workspace"
            value={tenant?.name ?? "Workspace atual"}
            description="Contexto ativo da sua sessão autenticada."
            icon={Building2}
          />
        </div>

        <section id="password" className="min-w-0 scroll-mt-28">
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  );
}
