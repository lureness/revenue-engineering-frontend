import { PublicSurveyFlow } from "@/components/surveys/public-survey-flow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { publicEnv } from "@/lib/env";

type DiagnosticoPageProps = {
  searchParams: Promise<{
    submission?: string;
    token?: string;
  }>;
};

export default async function DiagnosticoPage({
  searchParams,
}: DiagnosticoPageProps) {
  const { submission, token } = await searchParams;

  if (!publicEnv.diagnosticoTenantSlug || !publicEnv.diagnosticoSurveySlug) {
    return (
      <main className="page-frame bg-lureness-glow">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <Card className="w-full rounded-[2rem] bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
                Diagnóstico indisponível
              </CardTitle>
              <CardDescription className="leading-7">
                A rota pública <code>/diagnostico</code> ainda não foi
                configurada neste ambiente.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              Defina <code>NEXT_PUBLIC_DIAGNOSTICO_TENANT_SLUG</code> e{" "}
              <code>NEXT_PUBLIC_DIAGNOSTICO_SURVEY_SLUG</code> para apontar para
              o survey fixo do produto.
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <PublicSurveyFlow
      tenantSlug={publicEnv.diagnosticoTenantSlug}
      surveySlug={publicEnv.diagnosticoSurveySlug}
      initialSubmissionId={submission ?? null}
      initialPublicToken={token ?? null}
    />
  );
}
