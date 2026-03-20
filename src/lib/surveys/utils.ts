import type {
  PublicSurveyQuestionItem,
  PublicSurveySubmissionItem,
  PublicSurveyTemplateItem,
} from "@/lib/surveys/types";

type SurveyAttributionParams = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
};

export function buildPublicSurveyPath(tenantSlug: string, surveySlug: string) {
  return `/surveys/${tenantSlug}/${surveySlug}`;
}

export function buildPublicSurveyUrl(args: {
  origin: string;
  tenantSlug: string;
  surveySlug: string;
  attribution?: SurveyAttributionParams;
}) {
  const url = new URL(
    buildPublicSurveyPath(args.tenantSlug, args.surveySlug),
    args.origin,
  );

  for (const [key, value] of Object.entries(args.attribution ?? {})) {
    if (!value?.trim()) {
      continue;
    }

    url.searchParams.set(key, value.trim());
  }

  return url.toString();
}

export function buildSurveyIframeSnippet(args: {
  publicUrl: string;
  title: string;
  height?: string | number;
}) {
  const height = String(args.height || 1100).trim() || "1100";

  return `<iframe
  src="${args.publicUrl}"
  title="${args.title}"
  width="100%"
  height="${height}"
  style="border:0;border-radius:24px;overflow:hidden;"
  loading="lazy"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>`;
}

export function buildPublicSurveyResumePath(args: {
  tenantSlug: string;
  surveySlug: string;
  submissionId: string;
  publicToken: string;
}) {
  const query = new URLSearchParams({
    submission: args.submissionId,
    token: args.publicToken,
  });

  return `${buildPublicSurveyPath(args.tenantSlug, args.surveySlug)}?${query.toString()}`;
}

export function getAnsweredQuestionIds(submission: PublicSurveySubmissionItem) {
  return new Set(submission.answers.map((answer) => answer.question_id));
}

export function getCurrentSurveyQuestion(
  template: PublicSurveyTemplateItem,
  submission: PublicSurveySubmissionItem,
) {
  const answeredQuestionIds = getAnsweredQuestionIds(submission);

  return (
    template.questions.find(
      (question) => !answeredQuestionIds.has(question.id),
    ) ??
    template.questions.at(-1) ??
    null
  );
}

export function getQuestionNumber(
  template: PublicSurveyTemplateItem,
  question: PublicSurveyQuestionItem | null,
) {
  if (!question) {
    return 0;
  }

  const index = template.questions.findIndex((item) => item.id === question.id);

  return index >= 0 ? index + 1 : 0;
}

export function getSelectedOptionId(
  submission: PublicSurveySubmissionItem,
  questionId: string,
) {
  return (
    submission.answers.find((answer) => answer.question_id === questionId)
      ?.question_option_id ?? null
  );
}
