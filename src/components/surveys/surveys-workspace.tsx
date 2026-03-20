"use client";

import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Rocket,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAccess } from "@/components/access/access-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { formatDateTime } from "@/lib/observability/format";
import {
  TENANT_SURVEYS_MANAGE_PERMISSION,
  TENANT_SURVEYS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import {
  bootstrapIerSurveyTemplate,
  getSurveyTemplates,
} from "@/lib/surveys/api";
import type { SurveyTemplateItem } from "@/lib/surveys/types";
import {
  buildPublicSurveyPath,
  buildPublicSurveyUrl,
  buildSurveyIframeSnippet,
} from "@/lib/surveys/utils";
import { cn } from "@/lib/utils";

type SurveyAttributionFormState = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  iframe_height: string;
};

const INITIAL_ATTRIBUTION_FORM: SurveyAttributionFormState = {
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
  iframe_height: "1100",
};

function getConfigurationText(
  configuration: SurveyTemplateItem["configuration"],
  key: string,
  fallback: string,
) {
  const value = configuration?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function SurveysWorkspace() {
  const { status: accessStatus, hasTenantPermission } = useAccess();
  const { tenant } = useAuth();
  const [templates, setTemplates] = useState<SurveyTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [attributionForm, setAttributionForm] = useState(
    INITIAL_ATTRIBUTION_FORM,
  );
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isBootstrappingIer, setIsBootstrappingIer] = useState(false);

  const canReadSurveys = hasTenantPermission(TENANT_SURVEYS_READ_PERMISSION);
  const canManageSurveys = hasTenantPermission(
    TENANT_SURVEYS_MANAGE_PERMISSION,
  );
  const canAccessSurveys = canReadSurveys || canManageSurveys;

  useEffect(() => {
    if (accessStatus === "loading") {
      return;
    }

    if (!canReadSurveys) {
      setTemplates([]);
      setWorkspaceError(null);
      setIsLoadingTemplates(false);
      return;
    }

    let isActive = true;

    async function loadTemplates() {
      setIsLoadingTemplates(true);
      setWorkspaceError(null);

      try {
        const nextTemplates = await getSurveyTemplates();

        if (!isActive) {
          return;
        }

        setTemplates(nextTemplates);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar os surveys agora.",
        });
        setWorkspaceError(presentation.title);
        setTemplates([]);
      } finally {
        if (isActive) {
          setIsLoadingTemplates(false);
        }
      }
    }

    void loadTemplates();

    return () => {
      isActive = false;
    };
  }, [accessStatus, canReadSurveys]);

  async function refreshTemplates() {
    if (!canReadSurveys) {
      return;
    }

    setIsLoadingTemplates(true);
    setWorkspaceError(null);

    try {
      const nextTemplates = await getSurveyTemplates();
      setTemplates(nextTemplates);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível carregar os surveys agora.",
      });
      setWorkspaceError(presentation.title);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }

  async function handleBootstrapIer() {
    setIsBootstrappingIer(true);

    try {
      const template = await bootstrapIerSurveyTemplate();

      setTemplates((currentTemplates) => {
        const exists = currentTemplates.some((item) => item.id === template.id);

        if (exists) {
          return currentTemplates.map((item) =>
            item.id === template.id ? template : item,
          );
        }

        return [template, ...currentTemplates];
      });

      toast.success("Template IER instalado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível instalar o template IER agora.",
      });

      toast.error(presentation.title, {
        description: presentation.description,
      });

      if (canReadSurveys) {
        await refreshTemplates();
      }
    } finally {
      setIsBootstrappingIer(false);
    }
  }

  async function handleCopyPublicLink(template: SurveyTemplateItem) {
    if (!tenant) {
      toast.error("Não foi possível montar o link público deste survey.");
      return;
    }

    const publicPath = buildPublicSurveyPath(tenant.slug, template.slug);
    const publicUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPath}`
        : publicPath;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link público copiado.");
    } catch {
      toast.error("Não foi possível copiar o link agora.");
    }
  }

  async function copyText(value: string, successMessage: string) {
    if (!value.trim()) {
      toast.error("Não há conteúdo para copiar ainda.");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Não foi possível copiar agora.");
    }
  }

  const publishedTemplates = useMemo(
    () => templates.filter((template) => template.is_published).length,
    [templates],
  );

  const latestTemplate = templates[0] ?? null;
  const latestTemplateUpdatedAt = latestTemplate
    ? formatDateTime(latestTemplate.updated_at)
    : "Nenhum survey criado";
  const ierTemplate =
    templates.find((template) => template.code === "ier") ?? null;
  const selectedTemplate =
    templates.find((template) => template.id === selectedTemplateId) ??
    ierTemplate ??
    templates[0] ??
    null;
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "";
  const generatedPublicUrl =
    tenant && selectedTemplate && currentOrigin
      ? buildPublicSurveyUrl({
          origin: currentOrigin,
          tenantSlug: tenant.slug,
          surveySlug: selectedTemplate.slug,
          attribution: {
            utm_source: attributionForm.utm_source,
            utm_medium: attributionForm.utm_medium,
            utm_campaign: attributionForm.utm_campaign,
            utm_term: attributionForm.utm_term,
            utm_content: attributionForm.utm_content,
          },
        })
      : "";
  const generatedIframeSnippet =
    generatedPublicUrl && selectedTemplate
      ? buildSurveyIframeSnippet({
          publicUrl: generatedPublicUrl,
          title: selectedTemplate.name,
          height: attributionForm.iframe_height,
        })
      : "";

  useEffect(() => {
    if (
      selectedTemplateId &&
      templates.some((template) => template.id === selectedTemplateId)
    ) {
      return;
    }

    setSelectedTemplateId(templates[0]?.id ?? null);
  }, [selectedTemplateId, templates]);

  if (accessStatus === "loading") {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-[320px] items-center justify-center pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando acesso aos surveys...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canAccessSurveys) {
    return (
      <Empty className="border border-border/70 bg-card/85 shadow-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText className="size-4" />
          </EmptyMedia>
          <EmptyTitle>Surveys bloqueados neste workspace</EmptyTitle>
          <EmptyDescription>
            Você não tem permissão para visualizar ou gerenciar templates de
            diagnóstico neste workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="glow-border rounded-[1.8rem] bg-card shadow-md">
          <CardHeader className="gap-3">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit">
                Próximo motor de aquisição
              </Badge>
              <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
                Surveys públicos para capturar lead, gerar diagnóstico e abrir
                conversa no produto.
              </CardTitle>
              <CardDescription className="max-w-2xl leading-7">
                O primeiro survey oficial do workspace é o IER. Ele já nasce
                integrado ao backend com scoring, relatório parcial, unlock do
                relatório completo e vínculo com contatos.
              </CardDescription>
            </div>
            <CardAction>
              {canManageSurveys ? (
                <Button
                  onClick={handleBootstrapIer}
                  disabled={Boolean(ierTemplate) || isBootstrappingIer}
                  className="rounded-full px-5"
                >
                  {isBootstrappingIer ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Instalando...
                    </>
                  ) : ierTemplate ? (
                    <>
                      <Sparkles className="size-4" />
                      IER instalado
                    </>
                  ) : (
                    <>
                      <Rocket className="size-4" />
                      Criar survey IER
                    </>
                  )}
                </Button>
              ) : null}
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card size="sm" className="rounded-[1.4rem] bg-background/85">
                <CardContent className="grid gap-2 pt-4">
                  <Badge variant="secondary" className="w-fit">
                    Templates ativos
                  </Badge>
                  <p className="font-serif text-4xl tracking-tight text-foreground">
                    {templates.length}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="rounded-[1.4rem] bg-background/85">
                <CardContent className="grid gap-2 pt-4">
                  <Badge variant="secondary" className="w-fit">
                    Publicados
                  </Badge>
                  <p className="font-serif text-4xl tracking-tight text-foreground">
                    {publishedTemplates}
                  </p>
                </CardContent>
              </Card>
              <Card size="sm" className="rounded-[1.4rem] bg-background/85">
                <CardContent className="grid gap-2 pt-4">
                  <Badge variant="secondary" className="w-fit">
                    Última atualização
                  </Badge>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {latestTemplateUpdatedAt}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Captura inicial com e-mail e WhatsApp.",
                "Quiz em 5 etapas com progresso visual.",
                "Diagnóstico parcial com score e perfil.",
                "Unlock do relatório completo com enriquecimento do lead.",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-[1.25rem] border border-border/70 bg-background/85 px-4 py-3 text-sm leading-6 text-muted-foreground"
                >
                  {feature}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Template padrão
            </Badge>
            <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
              Índice de Eficiência de Receita
            </CardTitle>
            <CardDescription className="leading-7">
              O IER é o ponto de partida do motor de tráfego pago: captura,
              diagnostica, qualifica e cria o contexto comercial para os
              próximos domínios.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-[1.4rem] border border-border/70 bg-background/85 p-5">
              <div className="space-y-2">
                <Badge variant="secondary">
                  {ierTemplate
                    ? getConfigurationText(
                        ierTemplate.configuration,
                        "entry_badge",
                        "Diagnóstico gratuito",
                      )
                    : "Diagnóstico gratuito"}
                </Badge>
                <p className="font-serif text-3xl leading-none tracking-tight text-foreground">
                  {ierTemplate
                    ? getConfigurationText(
                        ierTemplate.configuration,
                        "entry_title",
                        "Índice de Eficiência de Receita",
                      )
                    : "Índice de Eficiência de Receita"}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  {ierTemplate
                    ? getConfigurationText(
                        ierTemplate.configuration,
                        "entry_subtitle",
                        "Descubra se sua operação está construindo patrimônio ou apenas queimando margem para crescer.",
                      )
                    : "Descubra se sua operação está construindo patrimônio ou apenas queimando margem para crescer."}
                </p>
              </div>
            </div>

            {ierTemplate && tenant ? (
              <div className="rounded-[1.4rem] border border-border/70 bg-background/85 p-4">
                <p className="eyebrow mb-3">Link público</p>
                <div className="rounded-2xl border border-border/70 bg-card/85 px-4 py-3 font-mono text-xs text-muted-foreground">
                  {buildPublicSurveyPath(tenant.slug, ierTemplate.slug)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {selectedTemplate && tenant ? (
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Kit de divulgação
            </Badge>
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Monte o link público com UTM e copie o iframe
            </CardTitle>
            <CardDescription className="leading-7">
              Gere uma URL pronta para Meta Ads, tráfego pago e parceiros. Se
              precisar embutir o diagnóstico em uma landing page, copie também o
              snippet de iframe.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="grid gap-4">
                <Field>
                  <FieldLabel>Survey publicado</FieldLabel>
                  <FieldContent>
                    <Select
                      value={selectedTemplate.id}
                      onValueChange={(value) => setSelectedTemplateId(value)}
                    >
                      <SelectTrigger className="h-11 w-full rounded-2xl px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>UTM Source</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.utm_source}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            utm_source: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="meta"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>UTM Medium</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.utm_medium}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            utm_medium: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="paid-social"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>UTM Campaign</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.utm_campaign}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            utm_campaign: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="ier-q2"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>UTM Content</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.utm_content}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            utm_content: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="criativo-a"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>UTM Term</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.utm_term}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            utm_term: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="diagnostico-receita"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Altura do iframe</FieldLabel>
                    <FieldContent>
                      <Input
                        value={attributionForm.iframe_height}
                        onChange={(event) =>
                          setAttributionForm((currentValue) => ({
                            ...currentValue,
                            iframe_height: event.target.value,
                          }))
                        }
                        className="h-11 rounded-2xl"
                        placeholder="1100"
                      />
                    </FieldContent>
                    <FieldDescription>
                      Ajuste esse valor para o tamanho da sua landing page.
                    </FieldDescription>
                  </Field>
                </div>
              </div>

              <div className="grid gap-4">
                <Field>
                  <FieldLabel>Link público com UTM</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={generatedPublicUrl}
                      readOnly
                      className="min-h-28 rounded-[1.5rem] bg-background/85 font-mono text-xs leading-6"
                    />
                  </FieldContent>
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full px-5"
                    onClick={() =>
                      void copyText(generatedPublicUrl, "Link com UTM copiado.")
                    }
                    disabled={!generatedPublicUrl}
                  >
                    <Copy className="size-4" />
                    Copiar link com UTM
                  </Button>
                  <Link
                    href={generatedPublicUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "rounded-full px-5",
                      !generatedPublicUrl && "pointer-events-none opacity-50",
                    )}
                  >
                    <ExternalLink className="size-4" />
                    Abrir prévia
                  </Link>
                </div>

                <Field>
                  <FieldLabel>Snippet de iframe</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={generatedIframeSnippet}
                      readOnly
                      className="min-h-52 rounded-[1.5rem] bg-background/85 font-mono text-xs leading-6"
                    />
                  </FieldContent>
                  <FieldDescription>
                    Recurso extra para embedar o survey em uma landing page.
                  </FieldDescription>
                </Field>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-full px-5"
                    onClick={() =>
                      void copyText(
                        generatedIframeSnippet,
                        "Snippet de iframe copiado.",
                      )
                    }
                    disabled={!generatedIframeSnippet}
                  >
                    <Copy className="size-4" />
                    Copiar iframe
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-full px-5"
                    onClick={() => setAttributionForm(INITIAL_ATTRIBUTION_FORM)}
                  >
                    Limpar UTMs
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="bg-card/85 shadow-sm">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Surveys do workspace
          </Badge>
          <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
            Templates publicados e criação
          </CardTitle>
          <CardDescription className="leading-7">
            Instale o IER agora e use o link público para campanhas, páginas de
            aquisição e experimentos de diagnóstico.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {workspaceError ? (
            <Empty className="border border-border/70 bg-background/80">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Não foi possível carregar os surveys</EmptyTitle>
                <EmptyDescription>{workspaceError}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : isLoadingTemplates ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-[1.5rem] border border-border/70 bg-background/85">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando templates...
              </div>
            </div>
          ) : templates.length === 0 ? (
            <Empty className="border border-border/70 bg-background/80">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Nenhum survey criado ainda</EmptyTitle>
                <EmptyDescription>
                  {canManageSurveys
                    ? "Comece instalando o template IER para publicar o primeiro diagnóstico do workspace."
                    : "Este workspace ainda não publicou surveys disponíveis."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {templates.map((template) => {
                const publicPath =
                  tenant !== null
                    ? buildPublicSurveyPath(tenant.slug, template.slug)
                    : null;

                return (
                  <Card
                    key={template.id}
                    className="rounded-[1.5rem] bg-background/85"
                  >
                    <CardHeader className="gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {template.code.toUpperCase()}
                          </Badge>
                          <Badge
                            variant={
                              template.is_published ? "secondary" : "outline"
                            }
                          >
                            {template.is_published ? "Publicado" : "Rascunho"}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="leading-7">
                          {template.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                          <div className="eyebrow mb-2">Slug público</div>
                          <div className="font-mono text-xs text-foreground">
                            {template.slug}
                          </div>
                        </div>
                        <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                          <div className="eyebrow mb-2">Atualizado em</div>
                          <div className="text-foreground">
                            {formatDateTime(template.updated_at)}
                          </div>
                        </div>
                      </div>

                      {publicPath ? (
                        <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                          <div className="eyebrow mb-2">Rota pública</div>
                          <div className="break-all font-mono text-xs text-muted-foreground">
                            {publicPath}
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        {publicPath ? (
                          <>
                            <Link
                              href={publicPath}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                buttonVariants({
                                  variant: "default",
                                }),
                                "rounded-full px-5",
                              )}
                            >
                              <ExternalLink className="size-4" />
                              Abrir experiência pública
                            </Link>
                            <Button
                              variant="outline"
                              className="rounded-full px-5"
                              onClick={() => handleCopyPublicLink(template)}
                            >
                              <Copy className="size-4" />
                              Copiar link
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
