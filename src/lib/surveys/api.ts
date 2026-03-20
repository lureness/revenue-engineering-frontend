import { apiRequest } from "@/lib/api/client";
import type {
  CompleteSurveySubmissionPayload,
  PublicSurveySubmissionItem,
  PublicSurveyTemplateItem,
  StartSurveySubmissionPayload,
  StartSurveySubmissionResponse,
  SubmitSurveyAnswerPayload,
  SurveyTemplateItem,
  UnlockSurveySubmissionPayload,
} from "@/lib/surveys/types";

export async function getSurveyTemplates() {
  return apiRequest<SurveyTemplateItem[]>("/surveys/templates", {
    method: "GET",
    cache: "no-store",
  });
}

export async function bootstrapIerSurveyTemplate() {
  return apiRequest<SurveyTemplateItem>("/surveys/templates/bootstrap/ier", {
    method: "POST",
    cache: "no-store",
  });
}

export async function getPublicSurveyTemplate(
  tenantSlug: string,
  surveySlug: string,
) {
  return apiRequest<PublicSurveyTemplateItem>(
    `/surveys/public/${tenantSlug}/${surveySlug}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );
}

export async function startPublicSurveySubmission(
  tenantSlug: string,
  surveySlug: string,
  payload: StartSurveySubmissionPayload,
) {
  return apiRequest<StartSurveySubmissionResponse>(
    `/surveys/public/${tenantSlug}/${surveySlug}/submissions`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function getPublicSurveySubmission(
  submissionId: string,
  publicToken: string,
) {
  return apiRequest<PublicSurveySubmissionItem>(
    `/surveys/public/submissions/${submissionId}`,
    {
      method: "GET",
      query: {
        public_token: publicToken,
      },
      cache: "no-store",
    },
  );
}

export async function submitPublicSurveyAnswer(
  submissionId: string,
  payload: SubmitSurveyAnswerPayload,
) {
  return apiRequest<PublicSurveySubmissionItem>(
    `/surveys/public/submissions/${submissionId}/answers`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function completePublicSurveySubmission(
  submissionId: string,
  payload: CompleteSurveySubmissionPayload,
) {
  return apiRequest<PublicSurveySubmissionItem>(
    `/surveys/public/submissions/${submissionId}/complete`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}

export async function unlockPublicSurveySubmission(
  submissionId: string,
  payload: UnlockSurveySubmissionPayload,
) {
  return apiRequest<PublicSurveySubmissionItem>(
    `/surveys/public/submissions/${submissionId}/unlock`,
    {
      method: "POST",
      body: payload,
      cache: "no-store",
    },
  );
}
