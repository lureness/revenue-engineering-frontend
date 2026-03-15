import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
});

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Lureness",
    template: "%s | Lureness",
  },
  description:
    "SaaS para operação com WhatsApp, times, governança e observabilidade em uma única superfície.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning={true}
      data-scroll-behavior="smooth"
    >
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} min-h-screen antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
