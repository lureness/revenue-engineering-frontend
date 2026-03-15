import type { ReactNode } from "react";

import { ProtectedWorkspaceShell } from "@/components/auth/protected-workspace-shell";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  return <ProtectedWorkspaceShell>{children}</ProtectedWorkspaceShell>;
}
