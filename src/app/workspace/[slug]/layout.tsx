import type { ReactNode } from "react";

import { ProtectedWorkspaceShell } from "@/components/auth/protected-workspace-shell";
import { WorkspaceChatLayout } from "@/components/workspace/workspace-chat-layout";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { slug } = await params;
  return (
    <ProtectedWorkspaceShell tenantSlug={slug}>
      <WorkspaceChatLayout>{children}</WorkspaceChatLayout>
    </ProtectedWorkspaceShell>
  );
}
