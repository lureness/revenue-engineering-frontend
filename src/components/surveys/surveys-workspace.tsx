"use client";

import {
  Copy,
  ExternalLink,
  FileText,
  Layers3,
  Loader2,
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
  CardAction,
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
  bootstrapIerSurveyTemplate,
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

function getConfigurationText(
  configuration: SurveyTemplateItem["configuration"],
  key: string,
  fallback: string,
) {
  const value = configuration?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
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

export function SurveysWorkspace() {
  const { status: accessStatus, hasTenantPermission } = useAccess();
  const { tenant } = useAuth();
  const [templates, setTemplates] = useState<SurveyTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [typebotForm, setTypebotForm] = useState(INITIAL_TYPEBOT_FORM);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isBootstrappingIer, setIsBootstrappingIer] = useState(false);
  const [isCreatingTypebot, setIsCreatingTypebot] = useState(false);

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
          fallbackTitle: "Nao foi possivel carregar os surveys agora.",
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
        fallbackTitle: "Nao foi possivel carregar os surveys agora.",
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
      setSelectedTemplateId(template.id);
      toast.success("Template IER instalado com sucesso.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Nao foi possivel instalar o template IER agora.",
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
      toast.success("Survey Typebot criado no workspace.");
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Nao foi possivel criar o survey Typebot agora.",
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
      toast.error("Nao foi possivel montar o link publico deste survey.");
      return;
    }

    const publicPath = buildPublicSurveyPath(tenant.slug, template.slug);
    const publicUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${publicPath}`
        : publicPath;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link publico copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o link agora.");
    }
  }

  const selectedTemplate = useMemo(() => {
    return (
      templates.find((template) => template.id === selectedTemplateId) ??
      templates[0] ??
      null
    );
  }, [selectedTemplateId, templates]);

  const publishedTemplates = useMemo(
    () => templates.filter((template) => template.is_published).length,
    [templates],
  );
  const typebotTemplates = useMemo(
    () => templates.filter((template) => template.engine === "typebot").length,
    [templates],
  );
  const diagnosticoPadraoTemplate = useMemo(
    () =>
      templates.filter(
        (template) => template.survey_kind === "diagnostico-padrao",
      ).length,
    [templates],
  );
  const ierTemplates = useMemo(
    () => templates.filter((template) => template.survey_kind === "ier").length,
    [templates],
  );

  const selectedTemplateUpdatedAt = selectedTemplate
    ? formatDateTime(selectedTemplate.updated_at)
    : "Nenhum survey criado";

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
            Voce nao tem permissao para visualizar ou gerenciar surveys neste
            workspace.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="glow-border rounded-[1.8rem] bg-card shadow-md">
        <CardHeader className="gap-3">
          <div className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              Engine de surveys
            </Badge>
            <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
              Typebot self-hosted como motor de captura, diagnostico e
              distribuicao.
            </CardTitle>
            <CardDescription className="max-w-2xl leading-7">
              O Lureness passa a catalogar e publicar surveys do workspace,
              enquanto a construcao do fluxo fica no Typebot self-hosted, com
              possibilidade de manter surveys nativos legados como o IER.
            </CardDescription>
          </div>
          <CardAction className="flex flex-wrap gap-3">
            {canManageSurveys ? (
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger
                  render={
                    <Button className="rounded-full px-5">
                      <Plus className="size-4" />
                      Criar novo
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
                        Criacao no workspace
                      </Badge>
                      <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                        Criar survey Typebot
                      </DialogTitle>
                      <DialogDescription className="leading-7">
                        Se `publicId` e URL de edicao ficarem vazios, o backend
                        cria o bot no Typebot via API e registra tudo no
                        workspace. Se quiser, voce ainda pode informar esses
                        dados manualmente para vincular um bot ja existente.
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
                            placeholder="Diagnostico comercial"
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
                        <FieldLabel>Slug publico</FieldLabel>
                        <FieldContent>
                          <Input
                            value={typebotForm.slug}
                            onChange={(event) =>
                              setTypebotForm((currentValue) => ({
                                ...currentValue,
                                slug: normalizeSlug(event.target.value),
                              }))
                            }
                            onBlur={() => {
                              if (
                                !typebotForm.slug.trim() &&
                                typebotForm.name.trim()
                              ) {
                                setTypebotForm((currentValue) => ({
                                  ...currentValue,
                                  slug: normalizeSlug(currentValue.name),
                                }));
                              }
                            }}
                            className="h-11 rounded-2xl"
                            placeholder="diagnostico-comercial"
                          />
                        </FieldContent>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Descricao</FieldLabel>
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
                          placeholder="Promessa do diagnostico, contexto da campanha e posicionamento do survey."
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
                          Opcional. Se ficar vazio, o Typebot cria e devolve
                          esse ID.
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
                        <FieldDescription>
                          Opcional, para referencia interna.
                        </FieldDescription>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>URL de edicao do Typebot</FieldLabel>
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
                      <FieldDescription>
                        Opcional para vinculo manual. Na criacao automatica ela
                        volta pronta da API.
                      </FieldDescription>
                    </Field>

                    <DialogFooter className="-mx-0 -mb-0 rounded-none border-0 bg-transparent p-0 pt-1 sm:justify-end">
                      <Button
                        type="submit"
                        disabled={isCreatingTypebot || !typebotForm.name.trim()}
                        className="rounded-full px-5"
                      >
                        {isCreatingTypebot ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Criar survey no Typebot
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}

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
              <Button
                onClick={handleBootstrapIer}
                disabled={isBootstrappingIer}
                className="rounded-full px-5"
              >
                {isBootstrappingIer ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Instalar IER nativo
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
                  Total
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
                  Typebot
                </Badge>
                <p className="font-serif text-4xl tracking-tight text-foreground">
                  {typebotTemplates}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="rounded-[1.4rem] bg-background/85">
              <CardContent className="grid gap-2 pt-4">
                <Badge variant="secondary" className="w-fit">
                  Diagnóstico padrão
                </Badge>
                <p className="font-serif text-4xl tracking-tight text-foreground">
                  {diagnosticoPadraoTemplate}
                </p>
              </CardContent>
            </Card>
            <Card size="sm" className="rounded-[1.4rem] bg-background/85">
              <CardContent className="grid gap-2 pt-4">
                <Badge variant="secondary" className="w-fit">
                  IER
                </Badge>
                <p className="font-serif text-4xl tracking-tight text-foreground">
                  {ierTemplates}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Crie o fluxo conversacional direto no Typebot self-hosted.",
              "Publique o survey pela rota publica do Lureness.",
              "Acesse o editor do Typebot sempre que precisar refinar o fluxo.",
              "Mantenha surveys nativos legados enquanto migra a operacao.",
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] xl:items-start">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Biblioteca do workspace
            </Badge>
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Surveys cadastrados e prontos para distribuicao
            </CardTitle>
            <CardDescription className="leading-7">
              Cada survey continua tendo uma rota publica do Lureness, mas a
              experiencia pode ser executada pelo Typebot self-hosted.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {workspaceError ? (
              <Empty className="border border-border/70 bg-background/80">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nao foi possivel carregar os surveys</EmptyTitle>
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
                    <Layers3 className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum survey criado ainda</EmptyTitle>
                  <EmptyDescription>
                    Registre o primeiro survey Typebot deste workspace ou
                    instale o IER nativo para manter um template legado ativo.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => {
                  const publicPath =
                    tenant !== null
                      ? buildPublicSurveyPath(tenant.slug, template.slug)
                      : null;
                  const isSelected = template.id === selectedTemplate?.id;

                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer rounded-[1.5rem] bg-background/85 transition-colors",
                        isSelected &&
                          "border-foreground/20 ring-1 ring-foreground/15",
                      )}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <CardHeader className="gap-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {getEngineLabel(template.engine)}
                            </Badge>
                            <Badge variant="outline">
                              {getSurveyKindLabel(template.survey_kind)}
                            </Badge>
                            <Badge
                              variant={
                                template.is_published ? "secondary" : "outline"
                              }
                            >
                              {template.is_published ? "Publicado" : "Rascunho"}
                            </Badge>
                            <Badge variant="outline">
                              {template.code.toUpperCase()}
                            </Badge>
                          </div>
                          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="leading-7">
                            {template.description ||
                              getConfigurationText(
                                template.configuration,
                                "entry_subtitle",
                                "Sem descricao cadastrada ainda.",
                              )}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                          <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                            <div className="eyebrow mb-2">Slug publico</div>
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

                        {template.engine === "typebot" ? (
                          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                            <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                              <div className="eyebrow mb-2">Public ID</div>
                              <div className="font-mono text-xs text-foreground">
                                {template.typebot_public_id || "Nao informado"}
                              </div>
                            </div>
                            <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                              <div className="eyebrow mb-2">Typebot ID</div>
                              <div className="font-mono text-xs text-foreground">
                                {template.typebot_typebot_id || "Nao informado"}
                              </div>
                            </div>
                            <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3 md:col-span-2">
                              <div className="eyebrow mb-2">
                                Webhook Typebot
                              </div>
                              <div className="break-all font-mono text-xs text-foreground">
                                {template.typebot_webhook_url ||
                                  "Nao configurado"}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {publicPath ? (
                          <div className="rounded-[1.2rem] border border-border/70 bg-card/85 px-4 py-3">
                            <div className="eyebrow mb-2">Rota publica</div>
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
                                  buttonVariants({ variant: "default" }),
                                  "rounded-full px-5",
                                )}
                              >
                                <ExternalLink className="size-4" />
                                Abrir experiencia publica
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

                          {template.typebot_edit_url ? (
                            <Link
                              href={template.typebot_edit_url}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "rounded-full px-5",
                              )}
                            >
                              <Sparkles className="size-4" />
                              Abrir editor Typebot
                            </Link>
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

        {selectedTemplate ? (
          <Card className="bg-card/85 shadow-sm xl:sticky xl:top-24">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Contexto do survey
              </Badge>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                Survey selecionado
              </CardTitle>
              <CardDescription className="leading-7">
                Resumo operacional do survey escolhido para distribuicao.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Engine</div>
                <div className="text-foreground">
                  {getEngineLabel(selectedTemplate.engine)}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Tipo funcional</div>
                <div className="text-foreground">
                  {getSurveyKindLabel(selectedTemplate.survey_kind)}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Slug</div>
                <div className="font-mono text-xs text-foreground">
                  {tenant
                    ? buildPublicSurveyPath(tenant.slug, selectedTemplate.slug)
                    : selectedTemplate.slug}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Atualizado</div>
                <div className="text-foreground">
                  {selectedTemplateUpdatedAt}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Edit URL</div>
                <div className="break-all text-xs text-muted-foreground">
                  {selectedTemplate.typebot_edit_url || "Nao informado"}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Webhook Typebot</div>
                <div className="break-all text-xs text-muted-foreground">
                  {selectedTemplate.typebot_webhook_url || "Nao configurado"}
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-3">
                <div className="eyebrow mb-2">Ultima ingestao</div>
                <div className="text-foreground">
                  {selectedTemplate.typebot_last_ingested_at
                    ? formatDateTime(selectedTemplate.typebot_last_ingested_at)
                    : "Ainda sem resultados recebidos"}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
