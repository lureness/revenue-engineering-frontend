import { PublicSurveyFlow } from "@/components/surveys/public-survey-flow";

type PublicSurveyPageProps = {
  params: Promise<{
    tenantSlug: string;
    surveySlug: string;
  }>;
  searchParams: Promise<{
    submission?: string;
    token?: string;
  }>;
};

export default async function PublicSurveyPage({
  params,
  searchParams,
}: PublicSurveyPageProps) {
  const { tenantSlug, surveySlug } = await params;
  const { submission, token } = await searchParams;

  return (
    <PublicSurveyFlow
      tenantSlug={tenantSlug}
      surveySlug={surveySlug}
      initialSubmissionId={submission ?? null}
      initialPublicToken={token ?? null}
    />
  );
}
