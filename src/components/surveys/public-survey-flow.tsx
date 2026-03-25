"use client";

import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Phone,
  Sparkles,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
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
import { formatApiErrorMessage } from "@/lib/api/error-messages";
import {
  completePublicSurveySubmission,
  getPublicSurveySubmission,
  getPublicSurveyTemplate,
  startPublicSurveySubmission,
  submitPublicSurveyAnswer,
  unlockPublicSurveySubmission,
} from "@/lib/surveys/api";
import type {
  PublicSurveySubmissionItem,
  PublicSurveyTemplateItem,
  SurveyPillarResultItem,
} from "@/lib/surveys/types";
import {
  buildPublicSurveyResumePath,
  buildTypebotViewerUrl,
  getCurrentSurveyQuestion,
  getQuestionNumber,
  getSelectedOptionId,
} from "@/lib/surveys/utils";
import { cn } from "@/lib/utils";

const ANNUAL_REVENUE_OPTIONS = [
  "Até R$ 500 mil",
  "R$ 500 mil a R$ 2 milhões",
  "R$ 2 milhões a R$ 10 milhões",
  "R$ 10 milhões a R$ 50 milhões",
  "Acima de R$ 50 milhões",
] as const;

const SALES_TEAM_SIZE_OPTIONS = [
  "Só founder ou owner",
  "2 a 5 pessoas",
  "6 a 10 pessoas",
  "11 a 25 pessoas",
  "26+ pessoas",
] as const;

type PublicSurveyFlowProps = {
  tenantSlug: string;
  surveySlug: string;
  initialSubmissionId?: string | null;
  initialPublicToken?: string | null;
};

type StartLeadFormState = {
  email: string;
  phone_number: string;
};

type UnlockFormState = {
  respondent_name: string;
  company_name: string;
  annual_revenue_range: string;
  sales_team_size_range: string;
};

const INITIAL_START_FORM: StartLeadFormState = {
  email: "",
  phone_number: "",
};

const INITIAL_UNLOCK_FORM: UnlockFormState = {
  respondent_name: "",
  company_name: "",
  annual_revenue_range: "",
  sales_team_size_range: "",
};

function getConfigurationText(
  configuration: PublicSurveyTemplateItem["configuration"],
  key: string,
  fallback: string,
) {
  const value = configuration?.[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

function SurveySurface({ children }: { children: ReactNode }) {
  return (
    <main className="page-frame bg-lureness-glow">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-20" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 pb-10">
          <LurenessMark subtitle="Public Survey" />
          <ThemeToggle />
        </header>

        <div className="flex flex-1 justify-center pb-14">{children}</div>
      </div>
    </main>
  );
}

function ProgressBar({
  answeredCount,
  totalQuestions,
}: {
  answeredCount: number;
  totalQuestions: number;
}) {
  const percentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Pergunta {Math.max(answeredCount + 1, 1)} de {totalQuestions}
        </span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-border/60">
        <div
          className="h-2 rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ScoreCircle({ value, maxValue }: { value: number; maxValue: number }) {
  return (
    <div className="mx-auto flex size-28 flex-col items-center justify-center rounded-full border-4 border-primary/25 bg-background text-center">
      <span className="font-serif text-4xl tracking-tight text-primary">
        {value}
      </span>
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        de {maxValue}
      </span>
    </div>
  );
}

function PillarBars({ pillars }: { pillars: SurveyPillarResultItem[] }) {
  return (
    <div className="grid gap-4">
      {pillars.map((pillar) => (
        <div key={pillar.question_id} className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">
              {pillar.pillar_name}
            </span>
            <span className="text-muted-foreground">{pillar.percentage}%</span>
          </div>
          <div className="h-2 rounded-full bg-border/60">
            <div
              className="h-2 rounded-full bg-primary"
              style={{ width: `${pillar.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicSurveyFlow({
  tenantSlug,
  surveySlug,
  initialSubmissionId = null,
  initialPublicToken = null,
}: PublicSurveyFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<PublicSurveyTemplateItem | null>(
    null,
  );
  const [submission, setSubmission] =
    useState<PublicSurveySubmissionItem | null>(null);
  const [publicToken, setPublicToken] = useState<string | null>(
    initialPublicToken,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [pageError, setPageError] = useState<string | null>(null);
  const [startForm, setStartForm] =
    useState<StartLeadFormState>(INITIAL_START_FORM);
  const [unlockForm, setUnlockForm] =
    useState<UnlockFormState>(INITIAL_UNLOCK_FORM);
  const [isStarting, setIsStarting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);

  const hydrateUnlockForm = useCallback(
    (nextSubmission: PublicSurveySubmissionItem | null) => {
      if (!nextSubmission) {
        setUnlockForm(INITIAL_UNLOCK_FORM);
        return;
      }

      setUnlockForm({
        respondent_name: nextSubmission.respondent_name ?? "",
        company_name: nextSubmission.company_name ?? "",
        annual_revenue_range: nextSubmission.annual_revenue_range ?? "",
        sales_team_size_range: nextSubmission.sales_team_size_range ?? "",
      });
    },
    [],
  );

  useEffect(() => {
    let isActive = true;

    async function loadSurvey() {
      setStatus("loading");
      setPageError(null);

      try {
        const nextTemplate = await getPublicSurveyTemplate(
          tenantSlug,
          surveySlug,
        );

        if (!isActive) {
          return;
        }

        setTemplate(nextTemplate);

        if (
          nextTemplate.engine !== "typebot" &&
          initialSubmissionId &&
          initialPublicToken
        ) {
          const nextSubmission = await getPublicSurveySubmission(
            initialSubmissionId,
            initialPublicToken,
          );

          if (!isActive) {
            return;
          }

          setSubmission(nextSubmission);
          setPublicToken(initialPublicToken);
          hydrateUnlockForm(nextSubmission);
        } else {
          setSubmission(null);
          setPublicToken(null);
          hydrateUnlockForm(null);
        }

        setStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        const presentation = formatApiErrorMessage(error, {
          fallbackTitle: "Não foi possível carregar este survey agora.",
        });
        setPageError(
          presentation.description
            ? `${presentation.title} ${presentation.description}`
            : presentation.title,
        );
        setStatus("error");
      }
    }

    void loadSurvey();

    return () => {
      isActive = false;
    };
  }, [
    hydrateUnlockForm,
    initialPublicToken,
    initialSubmissionId,
    surveySlug,
    tenantSlug,
  ]);

  const currentQuestion = useMemo(() => {
    if (!template || !submission || submission.result) {
      return null;
    }

    return getCurrentSurveyQuestion(template, submission);
  }, [submission, template]);

  const typebotViewerUrl = useMemo(() => {
    if (
      !template ||
      template.engine !== "typebot" ||
      !template.typebot_public_url
    ) {
      return null;
    }

    const forwardedParams = new URLSearchParams();

    for (const [key, value] of searchParams.entries()) {
      if (!value.trim() || key === "submission" || key === "token") {
        continue;
      }

      forwardedParams.set(key, value);
    }

    return buildTypebotViewerUrl({
      publicUrl: template.typebot_public_url,
      searchParams: forwardedParams,
    });
  }, [searchParams, template]);

  const currentQuestionNumber = useMemo(() => {
    if (!template) {
      return 0;
    }

    return getQuestionNumber(template, currentQuestion);
  }, [currentQuestion, template]);
  const currentQuestionId = currentQuestion?.id ?? null;

  async function handleStartSurvey(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!template) {
      return;
    }

    setIsStarting(true);

    try {
      const nextSubmission = await startPublicSurveySubmission(
        tenantSlug,
        surveySlug,
        {
          email: startForm.email.trim(),
          phone_number: startForm.phone_number.trim(),
        },
      );

      setSubmission(nextSubmission);
      setPublicToken(nextSubmission.public_token);
      hydrateUnlockForm(nextSubmission);
      router.replace(
        buildPublicSurveyResumePath({
          tenantSlug,
          surveySlug,
          submissionId: nextSubmission.id,
          publicToken: nextSubmission.public_token,
        }),
      );
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível iniciar o diagnóstico agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleAnswerQuestion(questionId: string, optionId: string) {
    if (!submission || !publicToken || isAnswering) {
      return;
    }

    setIsAnswering(true);

    try {
      const updatedSubmission = await submitPublicSurveyAnswer(submission.id, {
        public_token: publicToken,
        question_id: questionId,
        question_option_id: optionId,
      });

      if (
        updatedSubmission.answered_count ===
          updatedSubmission.total_questions &&
        !updatedSubmission.result
      ) {
        const completedSubmission = await completePublicSurveySubmission(
          updatedSubmission.id,
          {
            public_token: publicToken,
          },
        );
        setSubmission(completedSubmission);
        hydrateUnlockForm(completedSubmission);
        return;
      }

      setSubmission(updatedSubmission);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível registrar a resposta agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsAnswering(false);
    }
  }

  async function handleUnlockReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!submission || !publicToken) {
      return;
    }

    setIsUnlocking(true);

    try {
      const unlockedSubmission = await unlockPublicSurveySubmission(
        submission.id,
        {
          public_token: publicToken,
          respondent_name: unlockForm.respondent_name.trim(),
          company_name: unlockForm.company_name.trim(),
          annual_revenue_range: unlockForm.annual_revenue_range,
          sales_team_size_range: unlockForm.sales_team_size_range,
        },
      );
      setSubmission(unlockedSubmission);
      hydrateUnlockForm(unlockedSubmission);
      setShowUnlockForm(false);
    } catch (error) {
      const presentation = formatApiErrorMessage(error, {
        fallbackTitle: "Não foi possível desbloquear o relatório agora.",
      });
      toast.error(presentation.title, {
        description: presentation.description,
      });
    } finally {
      setIsUnlocking(false);
    }
  }

  function handleResultCta() {
    toast.success(
      "O CTA comercial do diagnóstico já está pronto para ser conectado à agenda do especialista.",
    );
  }

  if (status === "loading") {
    return (
      <SurveySurface>
        <Card className="surface-panel-strong my-auto w-full max-w-xl rounded-[2rem]">
          <CardContent className="flex min-h-[320px] items-center justify-center pt-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Preparando o diagnóstico...
            </div>
          </CardContent>
        </Card>
      </SurveySurface>
    );
  }

  if (status === "error" || !template) {
    return (
      <SurveySurface>
        <div className="my-auto w-full max-w-xl">
          <Empty className="surface-panel-strong rounded-[2rem] bg-card shadow-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlert className="size-4" />
              </EmptyMedia>
              <EmptyTitle>Survey indisponível</EmptyTitle>
              <EmptyDescription>
                {pageError ?? "Não encontramos este diagnóstico público."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </SurveySurface>
    );
  }

  if (template.engine === "typebot") {
    return (
      <SurveySurface>
        <div className="grid w-full max-w-6xl gap-6">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5">
              <Sparkles className="mr-2 size-4" />
              Typebot self-hosted
            </Badge>
            <h1 className="font-serif text-4xl tracking-tight text-foreground md:text-6xl">
              {template.name}
            </h1>
            <p className="text-base leading-8 text-muted-foreground md:text-lg">
              {template.description}
            </p>
          </div>

          {typebotViewerUrl ? (
            <Card className="surface-panel-strong overflow-hidden rounded-[2rem] p-0">
              <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border/60 px-6 py-5">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                    Survey publico
                  </CardTitle>
                  <CardDescription>
                    A experiencia esta sendo executada pelo Typebot e exposta
                    pela rota publica do Lureness.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full px-5"
                  onClick={() =>
                    window.open(
                      typebotViewerUrl,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  <ExternalLink className="size-4" />
                  Abrir direto no Typebot
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={typebotViewerUrl}
                  title={template.name}
                  className="block h-[calc(100vh-16rem)] min-h-[720px] w-full border-0 bg-background"
                  allow="clipboard-write; microphone"
                />
              </CardContent>
            </Card>
          ) : (
            <Empty className="surface-panel-strong rounded-[2rem] bg-card shadow-md">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TriangleAlert className="size-4" />
                </EmptyMedia>
                <EmptyTitle>Survey Typebot sem publicacao valida</EmptyTitle>
                <EmptyDescription>
                  Este survey foi cadastrado, mas ainda nao tem uma URL publica
                  do Typebot pronta para exibicao.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </SurveySurface>
    );
  }

  const entryBadge = getConfigurationText(
    template.configuration,
    "entry_badge",
    "Diagnóstico gratuito",
  );
  const entryTitle = getConfigurationText(
    template.configuration,
    "entry_title",
    template.name,
  );
  const entrySubtitle = getConfigurationText(
    template.configuration,
    "entry_subtitle",
    template.description,
  );
  const entryCtaLabel = getConfigurationText(
    template.configuration,
    "entry_cta_label",
    "Iniciar diagnóstico",
  );
  const unlockBadge = getConfigurationText(
    template.configuration,
    "unlock_badge",
    "Último passo",
  );
  const unlockTitle = getConfigurationText(
    template.configuration,
    "unlock_title",
    "Desbloquear relatório",
  );
  const unlockSubtitle = getConfigurationText(
    template.configuration,
    "unlock_subtitle",
    "Complete seus dados para ver o diagnóstico completo.",
  );
  const unlockCtaLabel = getConfigurationText(
    template.configuration,
    "unlock_cta_label",
    "Ver relatório completo",
  );
  const resultTitle = getConfigurationText(
    template.configuration,
    "result_title",
    "Seu diagnóstico",
  );
  const resultSubtitle = getConfigurationText(
    template.configuration,
    "result_subtitle",
    template.name,
  );
  const resultSummaryTitle = getConfigurationText(
    template.configuration,
    "result_summary_title",
    "Diagnóstico resumido",
  );

  if (!submission) {
    return (
      <SurveySurface>
        <div className="my-auto grid w-full max-w-3xl gap-8">
          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5">
              <Sparkles className="mr-2 size-4" />
              {entryBadge}
            </Badge>
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
              {entryTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
              {entrySubtitle}
            </p>
          </div>

          <Card className="surface-panel-strong mx-auto w-full max-w-xl rounded-[2rem]">
            <CardContent className="grid gap-5 pt-6">
              <form className="grid gap-4" onSubmit={handleStartSurvey}>
                <Field>
                  <FieldLabel>E-mail profissional</FieldLabel>
                  <FieldContent>
                    <div className="relative">
                      <Input
                        type="email"
                        autoComplete="email"
                        value={startForm.email}
                        onChange={(event) =>
                          setStartForm((currentValue) => ({
                            ...currentValue,
                            email: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl pr-12"
                        placeholder="seu@empresa.com"
                      />
                      <Mail className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Telefone / WhatsApp</FieldLabel>
                  <FieldContent>
                    <div className="relative">
                      <Input
                        type="tel"
                        autoComplete="tel"
                        value={startForm.phone_number}
                        onChange={(event) =>
                          setStartForm((currentValue) => ({
                            ...currentValue,
                            phone_number: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl pr-12"
                        placeholder="(11) 99999-9999"
                      />
                      <Phone className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </FieldContent>
                  <FieldDescription>
                    Seus dados estão seguros. Não compartilhamos com terceiros.
                  </FieldDescription>
                </Field>

                <Button
                  type="submit"
                  className="mt-2 h-11 rounded-full text-sm font-semibold"
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      {entryCtaLabel}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </SurveySurface>
    );
  }

  if (
    submission.result &&
    !submission.result.full_report_unlocked &&
    showUnlockForm
  ) {
    return (
      <SurveySurface>
        <div className="my-auto w-full max-w-3xl">
          <div className="mb-6 flex justify-center">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setShowUnlockForm(false)}
            >
              <ChevronLeft className="size-4" />
              Voltar para o diagnóstico
            </Button>
          </div>

          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5">
              <Lock className="mr-2 size-4" />
              {unlockBadge}
            </Badge>
            <h1 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              {unlockTitle}
            </h1>
            <p className="text-base leading-8 text-muted-foreground">
              {unlockSubtitle}
            </p>
          </div>

          <Card className="surface-panel-strong mx-auto mt-8 w-full max-w-2xl rounded-[2rem]">
            <CardContent className="grid gap-5 pt-6">
              <form className="grid gap-4" onSubmit={handleUnlockReport}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Nome completo</FieldLabel>
                    <FieldContent>
                      <Input
                        value={unlockForm.respondent_name}
                        onChange={(event) =>
                          setUnlockForm((currentValue) => ({
                            ...currentValue,
                            respondent_name: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl"
                        placeholder="Seu nome"
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>Empresa</FieldLabel>
                    <FieldContent>
                      <Input
                        value={unlockForm.company_name}
                        onChange={(event) =>
                          setUnlockForm((currentValue) => ({
                            ...currentValue,
                            company_name: event.target.value,
                          }))
                        }
                        className="h-12 rounded-2xl"
                        placeholder="Nome da empresa"
                      />
                    </FieldContent>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Faturamento anual</FieldLabel>
                  <FieldContent>
                    <Select
                      value={unlockForm.annual_revenue_range || undefined}
                      onValueChange={(value) =>
                        setUnlockForm((currentValue) => ({
                          ...currentValue,
                          annual_revenue_range: value ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 w-full rounded-2xl px-4">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNUAL_REVENUE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>Tamanho do time comercial</FieldLabel>
                  <FieldContent>
                    <Select
                      value={unlockForm.sales_team_size_range || undefined}
                      onValueChange={(value) =>
                        setUnlockForm((currentValue) => ({
                          ...currentValue,
                          sales_team_size_range: value ?? "",
                        }))
                      }
                    >
                      <SelectTrigger className="h-12 w-full rounded-2xl px-4">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SALES_TEAM_SIZE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <div className="grid gap-3 rounded-[1.4rem] border border-border/70 bg-muted/35 px-4 py-4 text-sm text-muted-foreground md:grid-cols-2">
                  <div>
                    <div className="eyebrow mb-2">E-mail</div>
                    <div className="text-foreground">
                      {submission.respondent_email}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow mb-2">Telefone</div>
                    <div className="text-foreground">
                      {submission.respondent_phone_number}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-11 rounded-full text-sm font-semibold"
                  disabled={isUnlocking}
                >
                  {isUnlocking ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Desbloqueando...
                    </>
                  ) : (
                    <>
                      {unlockCtaLabel}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </SurveySurface>
    );
  }

  if (!submission.result) {
    const selectedOptionId = currentQuestion
      ? getSelectedOptionId(submission, currentQuestion.id)
      : null;

    return (
      <SurveySurface>
        <div className="my-auto w-full max-w-3xl">
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <ProgressBar
              answeredCount={submission.answered_count}
              totalQuestions={submission.total_questions}
            />

            <Card className="surface-panel-strong rounded-[2rem]">
              <CardContent className="grid gap-5 pt-8">
                <div className="space-y-3">
                  {currentQuestion ? (
                    <>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-4 py-1"
                      >
                        Pilar {currentQuestionNumber} ·{" "}
                        {currentQuestion.pillar_name}
                      </Badge>
                      <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
                        {currentQuestion.title}
                      </h1>
                      {currentQuestion.description ? (
                        <p className="text-base leading-7 text-muted-foreground">
                          {currentQuestion.description}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  {currentQuestion?.options.map((option) => {
                    const isSelected = selectedOptionId === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isAnswering}
                        onClick={() => {
                          if (!currentQuestionId) {
                            return;
                          }

                          void handleAnswerQuestion(
                            currentQuestionId,
                            option.id,
                          );
                        }}
                        className={cn(
                          "grid gap-2 rounded-[1.35rem] border border-border/70 bg-background/85 px-5 py-4 text-left transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {option.code}
                          </span>
                          <div className="grid gap-1">
                            <div className="text-base font-medium text-foreground">
                              {option.label}
                            </div>
                            {option.description ? (
                              <div className="text-sm leading-6 text-muted-foreground">
                                {option.description}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isAnswering ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Registrando resposta...
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </SurveySurface>
    );
  }

  const result = submission.result;

  return (
    <SurveySurface>
      <div className="w-full max-w-4xl">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2 text-center">
            <p className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
              {resultTitle}
            </p>
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              {resultSubtitle}
            </p>
          </div>

          <Card className="surface-panel-strong rounded-[2rem]">
            <CardContent className="grid gap-4 pt-8 text-center">
              <ScoreCircle
                value={result.total_score}
                maxValue={result.max_score}
              />
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-4 py-1.5">
                  {result.profile.name}
                </Badge>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
                  {result.profile.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-panel rounded-[1.7rem]">
            <CardContent className="grid gap-3 pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                <p className="text-lg font-semibold text-foreground">
                  {resultSummaryTitle}
                </p>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {result.profile.summary}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="surface-panel rounded-[1.5rem]">
              <CardContent className="grid gap-2 pt-5 text-center">
                <p className="eyebrow">Maior força</p>
                <p className="text-base font-semibold text-foreground">
                  {result.strongest_pillar.pillar_name}
                </p>
                <p className="font-serif text-4xl tracking-tight text-primary">
                  {result.strongest_pillar.percentage}%
                </p>
              </CardContent>
            </Card>
            <Card className="surface-panel rounded-[1.5rem]">
              <CardContent className="grid gap-2 pt-5 text-center">
                <p className="eyebrow">Maior gargalo</p>
                <p className="text-base font-semibold text-foreground">
                  {result.weakest_pillar.pillar_name}
                </p>
                <p className="font-serif text-4xl tracking-tight text-destructive">
                  {result.weakest_pillar.percentage}%
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="surface-panel-strong rounded-[1.8rem]">
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                Desempenho por pilar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PillarBars pillars={result.pillars} />
            </CardContent>
          </Card>

          {!result.full_report_unlocked ? (
            <Card className="surface-panel-strong overflow-hidden rounded-[1.8rem]">
              <CardHeader className="border-b border-border/70 bg-secondary/25">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-primary" />
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Conteúdo exclusivo do relatório completo
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 pt-5">
                {result.report_sections.map((section) => (
                  <div
                    key={section.code}
                    className="flex items-start justify-between gap-4 rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-4"
                  >
                    <div className="grid gap-1">
                      <p className="font-medium text-foreground">
                        {section.title}
                      </p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    <Lock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </div>
                ))}

                <Button
                  className="mt-2 h-11 rounded-full text-sm font-semibold"
                  onClick={() => setShowUnlockForm(true)}
                >
                  <Lock className="size-4" />
                  {unlockCtaLabel}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="surface-panel-strong rounded-[1.8rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                    Gargalos identificados
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {result.identified_gaps.map((gap) => (
                    <div
                      key={`${gap.pillar_name}-${gap.question_title}`}
                      className="rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{gap.pillar_name}</Badge>
                        <Badge variant="outline">{gap.percentage}%</Badge>
                      </div>
                      <p className="font-medium text-foreground">
                        {gap.question_title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {gap.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="surface-panel-strong rounded-[1.8rem]">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                    Relatório completo liberado
                  </CardTitle>
                  <CardDescription className="leading-7">
                    Os blocos estratégicos do diagnóstico agora estão
                    disponíveis para a sequência comercial e de atendimento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {result.report_sections.map((section) => (
                    <div
                      key={section.code}
                      className="flex items-start gap-3 rounded-[1.3rem] border border-border/70 bg-background/85 px-4 py-4"
                    >
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div className="grid gap-1">
                        <p className="font-medium text-foreground">
                          {section.title}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}

          {result.cta ? (
            <Card className="surface-panel-strong rounded-[1.8rem]">
              <CardContent className="grid gap-4 pt-8 text-center">
                <p className="font-serif text-3xl tracking-tight text-foreground">
                  {result.cta.title}
                </p>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground">
                  {result.cta.description}
                </p>
                <div className="flex justify-center">
                  <Button
                    className="rounded-full px-6"
                    onClick={handleResultCta}
                  >
                    {result.cta.button_label}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!result.full_report_unlocked ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => setShowUnlockForm(true)}
              >
                <Lock className="size-4" />
                Quero ver o relatório completo
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </SurveySurface>
  );
}
