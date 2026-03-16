import type { ReactNode } from "react";

import { LurenessMark } from "@/components/brand/lureness-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type AuthPublicLayoutProps = {
  subtitle: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  featureBadge: string;
  features: readonly string[];
  children: ReactNode;
};

export function AuthPublicLayout({
  subtitle,
  eyebrow,
  title,
  description,
  featureBadge,
  features,
  children,
}: AuthPublicLayoutProps) {
  return (
    <main className="page-frame bg-lureness-glow">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 pb-10">
          <LurenessMark subtitle={subtitle} />
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-8 pb-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="eyebrow">{eyebrow}</p>
              <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted-foreground">
                {description}
              </p>
            </div>

            <Card className="bg-card/85 shadow-sm">
              <CardContent className="grid gap-3 pt-4">
                <Badge variant="secondary" className="w-fit">
                  {featureBadge}
                </Badge>
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-[1.2rem] border border-border/70 bg-background/85 px-4 py-3 text-sm leading-6 text-muted-foreground"
                  >
                    {feature}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}
