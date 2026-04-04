import { LandingPagesView } from "@/components/workspace/lp/landing-pages-view";

type LandingPageCreateProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    pageId?: string;
  }>;
};

export default async function LandingPageCreatePage({
  params,
  searchParams,
}: LandingPageCreateProps) {
  const { slug } = await params;
  const { pageId } = await searchParams;

  return (
    <LandingPagesView tenantSlug={slug} mode="create" pageId={pageId ?? null} />
  );
}
