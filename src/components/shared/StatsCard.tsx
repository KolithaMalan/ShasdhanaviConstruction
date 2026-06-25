import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const accents: Record<NonNullable<StatsCardProps["accent"]>, string> = {
  default: "from-slate-500/15 to-transparent",
  success: "from-emerald-500/20 to-transparent",
  warning: "from-amber-500/20 to-transparent",
  danger: "from-red-500/20 to-transparent",
  info: "from-sky-500/20 to-transparent",
};

export function StatsCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = "default",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl bg-gradient-to-br",
          accents[accent],
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
