import { AccountSettingsView } from "@/components/workspace/settings/account-settings-view";

type AccountPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { slug } = await params;

  return <AccountSettingsView tenantSlug={slug} />;
}
