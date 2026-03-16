import { KeyRound } from "lucide-react";
import Link from "next/link";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const userMenuItems = [
  {
    id: "password",
    label: "Alterar senha",
    description: "Atualize a senha da conta autenticada.",
  },
] as const;

export default function UserPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Card className="bg-card/85 shadow-sm">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Submenu
            </Badge>
            <CardTitle className="mt-2 text-xl tracking-tight text-foreground">
              Minha conta
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {userMenuItems.map((item) => (
              <Link
                key={item.id}
                href={`/app/user#${item.id}`}
                className="rounded-[1.2rem] border border-foreground/10 bg-foreground px-4 py-3 text-background shadow-sm transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/12">
                    <KeyRound className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-background/80">
                      {item.description}
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </aside>

      <section id="password" className="min-w-0 scroll-mt-28">
        <ChangePasswordForm />
      </section>
    </div>
  );
}
