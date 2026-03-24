import { LandingPagesView } from "@/components/workspace/lp/landing-pages-view";

type LandingPageCreatorProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function LandingPageCreator({
  params,
}: LandingPageCreatorProps) {
  const { slug } = await params;

  return <LandingPagesView tenantSlug={slug} mode="library" />;
}
