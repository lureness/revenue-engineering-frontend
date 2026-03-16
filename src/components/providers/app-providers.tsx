"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

import { AccessProvider } from "@/components/access/access-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <AccessProvider>{children}</AccessProvider>
      </AuthProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
