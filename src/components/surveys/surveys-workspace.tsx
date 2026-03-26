"use client";

import {
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  type LucideIcon,
  Plus,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import { publicEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/observability/format";
import {
  TENANT_SURVEYS_MANAGE_PERMISSION,
  TENANT_SURVEYS_READ_PERMISSION,
} from "@/lib/rbac/permissions";
import {
  createTypebotSurveyTemplate,
  getSurveyTemplates,
} from "@/lib/surveys/api";
import type { SurveyTemplateItem } from "@/lib/surveys/types";
import { buildPublicSurveyPath } from "@/lib/surveys/utils";
import { cn } from "@/lib/utils";

type CreateTypebotFormState = {
  name: string;
  slug: string;
  description: string;
  survey_kind: string;
  typebot_public_id: string;
  typebot_typebot_id: string;
  typebot_edit_url: string;
};

type SurveyCatalogItem = {
  kind: string;
  label: string;
  description: string;
  defaultName: string;
  slugBase: string;
  icon: LucideIcon;
};

const SURVEY_CATALOG: SurveyCatalogItem[] = [
  {
    kind: "ier",
    label: "IER",
    description:
      "Diagnóstico de Índice de Eficiência de Receita alinhado ao playbook de atendimento.",
    defaultName: "Índice de Eficiência de Receita",
    slugBase: "ier",
    icon: Rocket,
  },
  {
    kind: "diagnostico-padrao",
    label: "Diagnóstico padrão",
    description:
      "Survey interativo padrão do produto para campanhas, CTA público e follow-up consultivo.",
    defaultName: "Diagnóstico padrão",
    slugBase: "diagnostico",
    icon: Sparkles,
  },
  {
    kind: "custom",
    label: "Customizado",
    description:
      "Bot Typebot livre para outros fluxos de captação, qualificação e operação do workspace.",
    defaultName: "Survey customizado",
    slugBase: "survey",
    icon: Plus,
  },
];

const INITIAL_TYPEBOT_FORM: CreateTypebotFormState = {
  name: "",
  slug: "",
  description: "",
  survey_kind: "custom",
  typebot_public_id: "",
  typebot_typebot_id: "",
  typebot_edit_url: "",
};

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function trimToNull(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getEngineLabel(engine: string) {
  return engine === "typebot" ? "Typebot" : "Nativo";
}

function getSurveyKindLabel(surveyKind: string) {
  switch (surveyKind) {
    case "ier":
      return "IER";
    case "diagnostico-padrao":
      return "Diagnóstico padrão";
    default:
      return "Customizado";
  }
}

function buildUniqueSurveySlug(
  slugBase: string,
  existingTemplates: SurveyTemplateItem[],
) {
  const normalizedBase = normalizeSlug(slugBase) || "survey";
  const existingSlugs = new Set(
    existingTemplates.map((template) => template.slug),
  );

  if (!existingSlugs.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  while (existingSlugs.has(`${normalizedBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedBase}-${suffix}`;
}

function buildCatalogSurveyName(
  catalogItem: SurveyCatalogItem,
  slug: string,
  existingTemplates: SurveyTemplateItem[],
) {
  const sameKindCount = existingTemplates.filter(
    (template) => template.survey_kind === catalogItem.kind,
  ).length;

  if (sameKindCount === 0) {
    return catalogItem.defaultName;
  }

  const slugSuffix = slug.replace(`${catalogItem.slugBase}-`, "").trim();
  if (slugSuffix && slugSuffix !== catalogItem.slugBase) {
    return `${catalogItem.defaultName} ${slugSuffix}`;
  }

  return `${catalogItem.defaultName} ${sameKindCount + 1}`;
}

export function SurveysWorkspace() {
  const { status: accessStatus, hasTenantPermission } = useAccess();
  const { tenant } = useAuth();
  const [templates, setTemplates] = useState<SurveyTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [typebotForm, setTypebotForm] = useState(INITIAL_TYPEBOT_FORM);
  const [isCreatingTypebot, setIsCreatingTypebot] = useState(false);
  const [isCreatingCatalogKind, setIsCreatingCatalogKind] = useState<
    string | null
  >(null);

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

  useEffect(() => {
    if (
      selectedTemplateId &&
      templates.some((template) => template.id === selectedTemplateId)
    ) {
      return;
    }

    setSelectedTemplateId(templates[0]?.id ?? null);
  }, [selectedTemplateId, templates]);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ??
      templates[0] ??
      null,
    [selectedTemplateId, templates],
  );

  const publishedTemplates = useMemo(
    () => templates.filter((template) => template.is_published).length,
    [templates],
  );
  const ierTemplates = useMemo(
    () => templates.filter((template) => template.survey_kind === "ier").length,
    [templates],
  );
  const diagnosticoTemplates = useMemo(
    () =>
      templates.filter(
        (template) => template.survey_kind === "diagnostico-padrao",
      ).length,
    [templates],
  );

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

  async function createCatalogSurvey(catalogItem: SurveyCatalogItem) {
    setIsCreatingCatalogKind(catalogItem.kind);

    try {
      const slug = buildUniqueSurveySlug(catalogItem.slugBase, templates);
      const template = await createTypebotSurveyTemplate({
        slug,
        name: buildCatalogSurveyName(catalogItem, slug, templates),
        description: catalogItem.description,
        survey_kind: catalogItem.kind,
        configuration: {
          entry_badge: "Typebot self-hosted",
          entry_title: catalogItem.label,
          entry_subtitle: catalogItem.description,
        },
        is_published: true,
      });

      setTemplates((currentTemplates) => [template, ...currentTemplates]);
      setSelectedTemplateId(template.id);
      toast.success(
        `${catalogItem.label} criado no Typebot e registrado no workspace.`,
      );
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: `Não foi possível criar ${catalogItem.label} agora.`,
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });

      if (canReadSurveys) {
        await refreshTemplates();
      }
    } finally {
      setIsCreatingCatalogKind(null);
    }
  }

  async function handleCreateTypebotTemplate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setIsCreatingTypebot(true);

    try {
      const template = await createTypebotSurveyTemplate({
        slug: normalizeSlug(typebotForm.slug || typebotForm.name),
        name: typebotForm.name.trim(),
        description: trimToNull(typebotForm.description),
        survey_kind: typebotForm.survey_kind,
        typebot_public_id: trimToNull(typebotForm.typebot_public_id),
        typebot_typebot_id: trimToNull(typebotForm.typebot_typebot_id),
        typebot_edit_url: trimToNull(typebotForm.typebot_edit_url),
        configuration: {
          entry_badge: "Typebot self-hosted",
        },
        is_published: true,
      });

      setTemplates((currentTemplates) => [template, ...currentTemplates]);
      setSelectedTemplateId(template.id);
      setTypebotForm(INITIAL_TYPEBOT_FORM);
      setIsCreateDialogOpen(false);
      toast.success("Survey Typebot vinculado ao workspace.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível vincular o survey agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingTypebot(false);
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
            Você não tem permissão para visualizar ou gerenciar surveys neste
            workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr_1.2fr]">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader className="gap-4">
            <div className="space-y-1">
              <CardTitle>Biblioteca de surveys</CardTitle>
              <CardDescription>
                IER, diagnóstico padrão e fluxos customizados já partem do
                Typebot como engine oficial do workspace.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {publicEnv.typebotBuilderUrl ? (
                <Link
                  href={publicEnv.typebotBuilderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full px-5",
                  )}
                >
                  <ExternalLink className="size-4" />
                  Abrir Typebot
                </Link>
              ) : null}

              {canManageSurveys ? (
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={setIsCreateDialogOpen}
                >
                  <DialogTrigger
                    render={
                      <Button variant="outline" className="rounded-full px-5">
                        <Plus className="size-4" />
                        Vincular existente
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-2xl">
                    <form
                      className="grid gap-5"
                      onSubmit={handleCreateTypebotTemplate}
                    >
                      <DialogHeader>
                        <Badge variant="secondary" className="w-fit">
                          Vínculo manual
                        </Badge>
                        <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                          Registrar survey Typebot já existente
                        </DialogTitle>
                        <DialogDescription className="leading-7">
                          Use este fluxo apenas quando o bot já existir no
                          Typebot e você quiser refletir o survey dentro do
                          workspace.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Nome do survey</FieldLabel>
                          <FieldContent>
                            <Input
                              value={typebotForm.name}
                              onChange={(event) =>
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  name: event.target.value,
                                }))
                              }
                              className="h-11 rounded-2xl"
                              placeholder="Diagnóstico comercial"
                            />
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>Tipo funcional</FieldLabel>
                          <FieldContent>
                            <select
                              value={typebotForm.survey_kind}
                              onChange={(event) =>
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  survey_kind: event.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-2xl border border-border/70 bg-background px-4 text-sm text-foreground outline-none transition focus:border-foreground/30"
                            >
                              <option value="custom">Customizado</option>
                              <option value="diagnostico-padrao">
                                Diagnóstico padrão
                              </option>
                              <option value="ier">IER</option>
                            </select>
                          </FieldContent>
                        </Field>

                        <Field>
                          <FieldLabel>Slug público</FieldLabel>
                          <FieldContent>
                            <Input
                              value={typebotForm.slug}
                              onChange={(event) =>
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  slug: normalizeSlug(event.target.value),
                                }))
                              }
                              className="h-11 rounded-2xl"
                              placeholder="diagnostico-comercial"
                            />
                          </FieldContent>
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel>Descrição</FieldLabel>
                        <FieldContent>
                          <Textarea
                            value={typebotForm.description}
                            onChange={(event) =>
                              setTypebotForm((currentValue) => ({
                                ...currentValue,
                                description: event.target.value,
                              }))
                            }
                            className="min-h-24 rounded-[1.5rem]"
                            placeholder="Promessa do diagnóstico, contexto da campanha e posicionamento do survey."
                          />
                        </FieldContent>
                      </Field>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field>
                          <FieldLabel>Typebot Public ID</FieldLabel>
                          <FieldContent>
                            <Input
                              value={typebotForm.typebot_public_id}
                              onChange={(event) =>
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  typebot_public_id: event.target.value,
                                }))
                              }
                              className="h-11 rounded-2xl"
                              placeholder="clx123publicid"
                            />
                          </FieldContent>
                          <FieldDescription>
                            Se ficar vazio, o backend tenta criar o bot via API.
                          </FieldDescription>
                        </Field>

                        <Field>
                          <FieldLabel>Typebot ID</FieldLabel>
                          <FieldContent>
                            <Input
                              value={typebotForm.typebot_typebot_id}
                              onChange={(event) =>
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  typebot_typebot_id: event.target.value,
                                }))
                              }
                              className="h-11 rounded-2xl"
                              placeholder="typebot_123"
                            />
                          </FieldContent>
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel>URL de edição do Typebot</FieldLabel>
                        <FieldContent>
                          <Input
                            value={typebotForm.typebot_edit_url}
                            onChange={(event) =>
                              setTypebotForm((currentValue) => ({
                                ...currentValue,
                                typebot_edit_url: event.target.value,
                              }))
                            }
                            className="h-11 rounded-2xl"
                            placeholder="http://localhost:18080/typebots/typebot_123/edit"
                          />
                        </FieldContent>
                      </Field>

                      <DialogFooter className="-mx-0 -mb-0 rounded-none border-0 bg-transparent p-0 pt-1 sm:justify-end">
                        <Button
                          type="submit"
                          disabled={
                            isCreatingTypebot || !typebotForm.name.trim()
                          }
                          className="rounded-full px-5"
                        >
                          {isCreatingTypebot ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Vinculando...
                            </>
                          ) : (
                            <>
                              <Plus className="size-4" />
                              Vincular survey
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SURVEY_CATALOG.map((catalogItem) => {
                const Icon = catalogItem.icon;
                const isCreating = isCreatingCatalogKind === catalogItem.kind;

                return (
                  <button
                    key={catalogItem.kind}
                    type="button"
                    onClick={() => void createCatalogSurvey(catalogItem)}
                    disabled={
                      !canManageSurveys || isCreatingCatalogKind !== null
                    }
                    className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-foreground/10 text-foreground">
                      {isCreating ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {catalogItem.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {catalogItem.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Separator />

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
                  Carregando surveys...
                </div>
              </div>
            ) : templates.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Sparkles className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum survey criado ainda</EmptyTitle>
                  <EmptyDescription>
                    Escolha um dos templates acima para provisionar o primeiro
                    survey Typebot do workspace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[1.1rem] border px-4 py-3 text-left transition-colors",
                      template.id === selectedTemplate?.id
                        ? "border-primary/35 bg-primary/10"
                        : "border-border/70 bg-background/85 hover:border-primary/25 hover:bg-card",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {template.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{template.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {getSurveyKindLabel(template.survey_kind)}
                      </Badge>
                      <Badge
                        variant={
                          template.is_published ? "default" : "secondary"
                        }
                      >
                        {template.is_published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo rápido</CardTitle>
            <CardDescription>
              Controle dos surveys publicados pelo workspace via Typebot.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Total
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {templates.length}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Publicados
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {publishedTemplates}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Rascunhos
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {templates.length - publishedTemplates}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                IER ativos:{" "}
                <span className="font-medium text-foreground">
                  {ierTemplates}
                </span>
              </p>
              <p>
                Diagnóstico padrão ativos:{" "}
                <span className="font-medium text-foreground">
                  {diagnosticoTemplates}
                </span>
              </p>
              <p>
                Os templates de produto agora provisionam surveys direto no
                Typebot, sem depender do bootstrap nativo do IER.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Contexto do survey</CardTitle>
            <CardDescription>
              Dados operacionais do survey selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="grid gap-3">
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Engine
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {getEngineLabel(selectedTemplate.engine)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Tipo funcional
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {getSurveyKindLabel(selectedTemplate.survey_kind)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Slug
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">
                    {tenant
                      ? buildPublicSurveyPath(
                          tenant.slug,
                          selectedTemplate.slug,
                        )
                      : selectedTemplate.slug}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Última atualização
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {formatDateTime(selectedTemplate.updated_at)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Public ID
                  </p>
                  <p className="mt-2 break-all text-sm font-medium text-foreground">
                    {selectedTemplate.typebot_public_id || "Não informado"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Edit URL
                  </p>
                  <p className="mt-2 break-all text-sm text-muted-foreground">
                    {selectedTemplate.typebot_edit_url || "Não informado"}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Webhook Typebot
                  </p>
                  <p className="mt-2 break-all text-sm text-muted-foreground">
                    {selectedTemplate.typebot_webhook_url || "Não configurado"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {tenant ? (
                    <>
                      <Link
                        href={buildPublicSurveyPath(
                          tenant.slug,
                          selectedTemplate.slug,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "rounded-full px-5",
                        )}
                      >
                        <ExternalLink className="size-4" />
                        Abrir público
                      </Link>
                      <Button
                        variant="outline"
                        className="rounded-full px-5"
                        onClick={() =>
                          void handleCopyPublicLink(selectedTemplate)
                        }
                      >
                        <Copy className="size-4" />
                        Copiar link
                      </Button>
                    </>
                  ) : null}

                  {selectedTemplate.typebot_edit_url ? (
                    <Link
                      href={selectedTemplate.typebot_edit_url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "rounded-full px-5",
                      )}
                    >
                      <ExternalLink className="size-4" />
                      Abrir editor
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum survey selecionado</EmptyTitle>
                  <EmptyDescription>
                    Crie ou escolha um survey da biblioteca para ver o contexto
                    operacional aqui.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
