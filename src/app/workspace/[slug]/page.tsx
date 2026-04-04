import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";

type WorkspacePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { slug } = await params;
  return <WorkspaceDashboard tenantSlug={slug} />;
}
