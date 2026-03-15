import { LurenessMark } from "@/components/brand/lureness-mark";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthRouteStateProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthRouteState({
  eyebrow,
  title,
  description,
}: AuthRouteStateProps) {
  return (
    <main className="page-frame bg-lureness-glow">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-25" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <Card className="glow-border w-full max-w-xl rounded-[2rem] bg-card shadow-md">
          <CardHeader className="gap-4">
            <LurenessMark subtitle="Authentication flow" />
            <div className="space-y-3">
              <Badge variant="secondary">{eyebrow}</Badge>
              <CardTitle className="font-serif text-3xl tracking-tight text-foreground">
                {title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-7">
              {description}
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
