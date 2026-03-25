"use client";

import {
  Copy,
  type FileText,
  Layers3,
  Monitor,
  Presentation,
  RefreshCcw,
  Smartphone,
  Sparkles,
  TableProperties,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  createLandingPage,
  deleteLandingPage,
  getLandingPages,
  updateLandingPage,
} from "@/lib/lp/api";
import { buildLandingPageCreatePayload } from "@/lib/lp/templates";
import type {
  LandingPageDraft,
  LandingPageTemplateCode,
  UpdateLandingPagePayload,
} from "@/lib/lp/types";
import { cn } from "@/lib/utils";
import {
  LandingPageGrapesEditor,
  type LandingPageGrapesEditorHandle,
} from "./landing-page-grapes-editor";

const templates: Array<{
  code: LandingPageTemplateCode;
  label: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    code: "lead-magnet",
    label: "Lead magnet",
    description: "Checklist, guia ou material de valor imediato para captacao.",
    icon: Sparkles,
  },
  {
    code: "diagnostic",
    label: "Diagnostico",
    description:
      "LP curta para prometer um diagnostico e abrir o follow-up consultivo.",
    icon: Layers3,
  },
  {
    code: "spreadsheet",
    label: "Planilha",
    description:
      "Material utilitario de alta percepcao de valor para campanhas frias.",
    icon: TableProperties,
  },
  {
    code: "webinar",
    label: "Aula",
    description: "Convite para evento, aula aberta, workshop ou aquecimento.",
    icon: Presentation,
  },
];

type LandingPagesViewMode = "library" | "create";

type LandingPagesViewProps = {
  tenantSlug: string;
  mode?: LandingPagesViewMode;
  pageId?: string | null;
};

function buildLandingPageUpdatePayload(
  page: LandingPageDraft,
): UpdateLandingPagePayload {
  return {
    name: page.name,
    slug: page.slug,
    template: page.template,
    status: page.status,
    eyebrow: page.eyebrow,
    headline: page.headline,
    subheadline: page.subheadline,
    primaryCta: page.primaryCta,
    secondaryCta: page.secondaryCta,
    captureTitle: page.captureTitle,
    captureDescription: page.captureDescription,
    benefitsText: page.benefitsText,
    proofText: page.proofText,
    projectData: page.projectData,
    renderedHtml: page.renderedHtml,
    renderedCss: page.renderedCss,
  };
}

export function LandingPagesView({
  tenantSlug,
  mode = "library",
  pageId = null,
}: LandingPagesViewProps) {
  const router = useRouter();
  const editorRef = useRef<LandingPageGrapesEditorHandle | null>(null);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const saveRevisionRef = useRef<Record<string, number>>({});
  const [pages, setPages] = useState<LandingPageDraft[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [isDeletingPageId, setIsDeletingPageId] = useState<string | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const isCreateMode = mode === "create";

  useEffect(() => {
    let isMounted = true;

    async function loadPages() {
      try {
        setIsLoading(true);
        const landingPages = await getLandingPages({ limit: 200 });

        if (!isMounted) {
          return;
        }

        const preferredId =
          pageId && landingPages.some((page) => page.id === pageId)
            ? pageId
            : isCreateMode
              ? null
              : (landingPages[0]?.id ?? null);

        setPages(landingPages);
        setSelectedId(preferredId);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar as landing pages.",
        });
        toast.error(presentation.title, {
          description: presentation.description,
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPages();

    return () => {
      isMounted = false;
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [isCreateMode, pageId]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedId) ?? null,
    [pages, selectedId],
  );

  const publishedCount = pages.filter(
    (page) => page.status === "published",
  ).length;

  const buildCreateHref = (id: string) =>
    `/workspace/${tenantSlug}/lp/create?pageId=${encodeURIComponent(id)}`;

  const handleOpenEditor = (id: string) => {
    router.push(buildCreateHref(id));
  };

  const persistPage = useCallback(
    async (page: LandingPageDraft, revision: number) => {
      try {
        setIsAutosaving(true);
        const savedPage = await updateLandingPage(
          page.id,
          buildLandingPageUpdatePayload(page),
        );

        if (saveRevisionRef.current[page.id] !== revision) {
          return;
        }

        setPages((current) =>
          current.map((item) => (item.id === savedPage.id ? savedPage : item)),
        );
      } catch (error) {
        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível salvar a landing page.",
        });
        toast.error(presentation.title, {
          description: presentation.description,
        });
      } finally {
        setIsAutosaving(false);
      }
    },
    [],
  );

  const schedulePersist = useCallback(
    (page: LandingPageDraft) => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }

      const revision = (saveRevisionRef.current[page.id] ?? 0) + 1;
      saveRevisionRef.current[page.id] = revision;

      autosaveTimeoutRef.current = window.setTimeout(() => {
        void persistPage(page, revision);
      }, 700);
    },
    [persistPage],
  );

  const applySelectedPageUpdate = useCallback(
    (updater: (page: LandingPageDraft) => LandingPageDraft) => {
      if (!selectedPage) {
        return;
      }

      const nextPage = updater(selectedPage);
      setPages((current) =>
        current.map((page) => (page.id === nextPage.id ? nextPage : page)),
      );
      schedulePersist(nextPage);
    },
    [schedulePersist, selectedPage],
  );

  const handleCreatePage = async (templateCode: LandingPageTemplateCode) => {
    try {
      setIsCreatingPage(true);
      const createdPage = await createLandingPage(
        buildLandingPageCreatePayload(templateCode, tenantSlug, pages.length),
      );
      setPages((current) => [createdPage, ...current]);
      setSelectedId(createdPage.id);
      toast.success("Landing page criada.");
      router.push(buildCreateHref(createdPage.id));
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível criar a landing page.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsCreatingPage(false);
    }
  };

  const handleDeletePage = async (currentPageId: string) => {
    const page = pages.find((item) => item.id === currentPageId);
    if (!page) return;

    if (!confirm(`Excluir LP "${page.name}"?`)) {
      return;
    }

    try {
      setIsDeletingPageId(currentPageId);
      await deleteLandingPage(currentPageId);

      const nextPages = pages.filter((item) => item.id !== currentPageId);
      const nextSelectedId = nextPages[0]?.id ?? null;

      setPages(nextPages);
      setSelectedId(nextSelectedId);
      toast.success("Landing page removida.");

      if (!isCreateMode) {
        return;
      }

      if (nextSelectedId) {
        router.replace(buildCreateHref(nextSelectedId));
        return;
      }

      router.replace(`/workspace/${tenantSlug}/lp`);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível excluir a landing page.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsDeletingPageId(null);
    }
  };

  const handleUpdatePage = <K extends keyof LandingPageDraft>(
    key: K,
    value: LandingPageDraft[K],
  ) => {
    applySelectedPageUpdate((page) => ({
      ...page,
      [key]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleProjectChange = useCallback(
    (payload: {
      projectData: LandingPageDraft["projectData"];
      renderedHtml: string;
      renderedCss: string;
    }) => {
      applySelectedPageUpdate((page) => ({
        ...page,
        projectData: payload.projectData,
        renderedHtml: payload.renderedHtml,
        renderedCss: payload.renderedCss,
        updatedAt: new Date().toISOString(),
      }));
    },
    [applySelectedPageUpdate],
  );

  const handleCopySlug = async () => {
    if (!selectedPage) return;

    try {
      await navigator.clipboard.writeText(selectedPage.slug);
      toast.success("Slug copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o slug.");
    }
  };

  if (isLoading && pages.length === 0) {
    return (
      <Card className="bg-card/85 shadow-sm">
        <CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Carregando landing pages...
        </CardContent>
      </Card>
    );
  }

  if (isCreateMode) {
    return (
      <div className="space-y-6">
        {!selectedPage ? (
          <Card className="bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle>Criar landing page</CardTitle>
              <CardDescription>
                Escolha um template para abrir o editor visual da nova LP.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {templates.map((template) => {
                  const Icon = template.icon;

                  return (
                    <button
                      key={template.code}
                      type="button"
                      onClick={() => handleCreatePage(template.code)}
                      disabled={isCreatingPage}
                      className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card"
                    >
                      <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-foreground/10 text-foreground">
                        <Icon className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {template.label}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {template.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              {pages.length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Rascunhos existentes
                    </p>
                    <div className="space-y-2">
                      {pages.map((page) => (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => handleOpenEditor(page.id)}
                          className="flex w-full items-center justify-between rounded-[1.1rem] border border-border/70 bg-background/85 px-4 py-3 text-left transition-colors hover:border-primary/25 hover:bg-card"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {page.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              /{page.slug}
                            </p>
                          </div>
                          <Badge
                            variant={
                              page.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {page.status === "published"
                              ? "Publicada"
                              : "Rascunho"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-card/85 shadow-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Configurações da LP</CardTitle>
                  <CardDescription>
                    Nome interno, slug e status persistidos no workspace.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/workspace/${tenantSlug}/lp`)}
                  >
                    Voltar para biblioteca
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleCopySlug()}
                  >
                    <Copy className="size-4" />
                    Copiar slug
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleUpdatePage(
                        "status",
                        selectedPage.status === "published"
                          ? "draft"
                          : "published",
                      )
                    }
                  >
                    {selectedPage.status === "published"
                      ? "Voltar para rascunho"
                      : "Marcar como publicada"}
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={isDeletingPageId === selectedPage.id}
                    onClick={() => handleDeletePage(selectedPage.id)}
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lp-name">Nome interno</Label>
                    <Input
                      id="lp-name"
                      value={selectedPage.name}
                      onChange={(event) =>
                        handleUpdatePage("name", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lp-slug">Slug</Label>
                    <Input
                      id="lp-slug"
                      value={selectedPage.slug}
                      onChange={(event) =>
                        handleUpdatePage("slug", event.target.value)
                      }
                    />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    O conteúdo visual é montado no editor drag-and-drop. Estes
                    campos controlam o contexto interno da LP no workspace.
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-border/70 bg-background/85 p-5">
                  <p className="text-sm font-medium text-foreground">
                    Persistência no backend
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cada ajuste salva o rascunho do editor visual no workspace.
                    Isso permite continuar a edição de qualquer dispositivo sem
                    depender do navegador atual.
                  </p>
                  {isAutosaving ? (
                    <Badge variant="secondary" className="mt-4">
                      Salvando...
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/85 shadow-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>Editor visual da LP</CardTitle>
                  <CardDescription>
                    Canvas drag-and-drop com autosave no backend usando
                    GrapesJS.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.setDevice("Desktop")}
                  >
                    <Monitor className="size-4" />
                    Desktop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.setDevice("Mobile")}
                  >
                    <Smartphone className="size-4" />
                    Mobile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void editorRef.current?.copyHtml()}
                  >
                    <Copy className="size-4" />
                    Copiar HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editorRef.current?.resetTemplate()}
                  >
                    <RefreshCcw className="size-4" />
                    Resetar template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <LandingPageGrapesEditor
                  ref={editorRef}
                  key={selectedPage.id}
                  page={selectedPage}
                  onProjectChange={handleProjectChange}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr_1.2fr]">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Biblioteca de LPs</CardTitle>
            <CardDescription>
              Crie e organize landing pages do workspace sem sair desta tela.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => {
                const Icon = template.icon;

                return (
                  <button
                    key={template.code}
                    type="button"
                    onClick={() => handleCreatePage(template.code)}
                    disabled={isCreatingPage}
                    className="rounded-[1.25rem] border border-border/70 bg-background/85 p-4 text-left transition-colors hover:border-primary/40 hover:bg-card"
                  >
                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-2xl bg-foreground/10 text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {template.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {template.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Separator />

            {pages.length === 0 ? (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Layers3 className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhuma LP criada ainda</EmptyTitle>
                  <EmptyDescription>
                    Escolha um template acima para iniciar a primeira landing
                    page do workspace.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedId(page.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-[1.1rem] border px-4 py-3 text-left transition-colors",
                      page.id === selectedId
                        ? "border-primary/35 bg-primary/10"
                        : "border-border/70 bg-background/85 hover:border-primary/25 hover:bg-card",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {page.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{page.slug}
                      </p>
                    </div>
                    <Badge
                      variant={
                        page.status === "published" ? "default" : "secondary"
                      }
                    >
                      {page.status === "published" ? "Publicada" : "Rascunho"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo rapido</CardTitle>
            <CardDescription>
              Controle persistido dos rascunhos e publicacoes deste workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Total
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {pages.length}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Publicadas
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {publishedCount}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Rascunhos
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  {pages.length - publishedCount}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm leading-6 text-muted-foreground">
              <p>
                As LPs ficam salvas no backend do workspace com HTML, CSS e
                dados estruturados do editor visual.
              </p>
              <p>
                O proximo passo natural agora e conectar dominio, captura de
                leads e integracoes com surveys, iscas e campanhas.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle>Contexto da LP</CardTitle>
            <CardDescription>
              Dados internos da landing page selecionada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedPage ? (
              <div className="grid gap-3">
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Template
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {templates.find(
                      (template) => template.code === selectedPage.template,
                    )?.label ?? selectedPage.template}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Slug
                  </p>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">
                    /{selectedPage.slug}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Ultima atualizacao
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {new Date(selectedPage.updatedAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-border/70 bg-background/85 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Exportacao
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    O HTML e o CSS exportados pelo editor ficam salvos neste
                    rascunho para uso futuro em publicacao real.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      HTML {selectedPage.renderedHtml ? "pronto" : "vazio"}
                    </Badge>
                    <Badge variant="secondary">
                      CSS {selectedPage.renderedCss ? "pronto" : "vazio"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditor(selectedPage.id)}
                    >
                      Abrir editor
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleCopySlug()}
                    >
                      <Copy className="size-4" />
                      Copiar slug
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Layers3 className="size-4" />
                  </EmptyMedia>
                  <EmptyTitle>Selecione ou crie uma LP</EmptyTitle>
                  <EmptyDescription>
                    O resumo da landing page aparece aqui assim que voce criar o
                    primeiro rascunho.
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
