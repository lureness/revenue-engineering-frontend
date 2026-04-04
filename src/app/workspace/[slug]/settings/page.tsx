import { SettingsOverview } from "@/components/workspace/settings/settings-overview";

type SettingsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { slug } = await params;

  return <SettingsOverview tenantSlug={slug} />;
}
