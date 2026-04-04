"use client";

import { useState } from "react";

import { GlobalChat, GlobalChatFab } from "@/components/workspace/global-chat";

type WorkspaceChatLayoutProps = {
  children: React.ReactNode;
};

export function WorkspaceChatLayout({ children }: WorkspaceChatLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {children}
      <GlobalChatFab onClick={() => setIsChatOpen(true)} />
      <GlobalChat open={isChatOpen} onOpenChange={setIsChatOpen} />
    </>
  );
}
