import { cn } from "@/lib/utils";

type LurenessMarkProps = {
  className?: string;
  compact?: boolean;
  subtitle?: string;
};

export function LurenessMark({
  className,
  compact = false,
  subtitle = "WhatsApp Operations Suite",
}: LurenessMarkProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div className="glow-border relative flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-sm">
        <span className="absolute inset-1 rounded-2xl bg-primary/12" />
        <span className="absolute inset-x-3 inset-y-4 rounded-full bg-accent/45 blur-md" />
        <span className="relative size-4 rounded-full bg-primary ring-4 ring-background" />
      </div>
      {compact ? null : (
        <div className="flex flex-col">
          <span className="font-serif text-2xl leading-none tracking-tight text-foreground">
            Lureness
          </span>
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
