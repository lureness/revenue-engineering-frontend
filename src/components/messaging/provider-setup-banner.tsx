"use client";

import { CheckCircle2, MessageCircleMore, RadioTower } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { useProviderSetup } from "@/components/messaging/provider-setup-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ChecklistItem({
  done,
  pendingTitle,
  doneTitle,
  title,
  description,
}: {
  done: boolean;
  pendingTitle?: string;
  doneTitle?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-background/75 px-4 py-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground">
          {done ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <RadioTower className="size-4" />
          )}
        </span>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {done ? (doneTitle ?? title) : (pendingTitle ?? title)}
            </p>
            <Badge variant={done ? "default" : "secondary"}>
              {done ? "Concluído" : "Pendente"}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProviderSetupBanner() {
  const { tenant } = useAuth();
  const { canShow, currentStep, hasProviderAccount, hasSender, isLoading } =
    useProviderSetup();

  if (isLoading || !canShow || !tenant?.slug) {
    return null;
  }

  const isProviderAccountStep = currentStep === "provider_account";
  const title = isProviderAccountStep
    ? "Conecte o provider de mensageria do workspace"
    : "Cadastre o primeiro sender do WhatsApp";
  const description = isProviderAccountStep
    ? "O workspace já pode operar o restante do produto, mas a conexão com um provider de mensageria ainda precisa ser criada para habilitar a operação de WhatsApp."
    : "A conta do provedor já existe. Agora falta cadastrar e ativar um sender para operar mensagens e abrir conversas no inbox.";
  const completedSteps = Number(hasProviderAccount) + Number(hasSender);
  const actionHref = isProviderAccountStep
    ? `/workspace/${tenant.slug}/inbox/messages#provider-account-form`
    : `/workspace/${tenant.slug}/inbox/messages#sender-form`;
  const actionLabel = isProviderAccountStep
    ? "Conectar provider"
    : "Cadastrar sender";

  return (
    <div className="relative z-10 px-6 pt-6 lg:px-4">
      <Card className="rounded-[1.8rem] border border-border/70 bg-card/90 shadow-sm">
        <CardContent className="grid gap-5 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Onboarding de provedor
              </Badge>
              <div className="space-y-2">
                <p className="font-serif text-2xl tracking-tight text-foreground">
                  {title}
                </p>
                <p className="text-sm font-medium text-foreground/80">
                  {completedSteps}/2 etapas concluídas
                </p>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <Button
              nativeButton={false}
              className="rounded-full px-5"
              render={<Link href={actionHref} />}
            >
              <MessageCircleMore className="size-4" />
              {actionLabel}
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <ChecklistItem
              done={hasProviderAccount}
              pendingTitle="Conectar provider de mensageria"
              doneTitle="Provider de mensageria conectado"
              title="Provider de mensageria conectado"
              description="Crie a conta operacional do provider para o workspace e prepare a integração base."
            />
            <ChecklistItem
              done={hasSender}
              pendingTitle="Cadastrar sender do WhatsApp"
              doneTitle="Sender do WhatsApp ativo"
              title="Sender do WhatsApp ativo"
              description="Cadastre um número do WhatsApp para receber e enviar mensagens dentro do inbox."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
