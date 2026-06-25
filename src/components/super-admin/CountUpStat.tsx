"use client";

import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const CountUp = dynamic(() => import("react-countup").then((m) => m.default), {
  ssr: false,
  loading: () => <>0</>,
});

interface Props {
  icon: LucideIcon;
  label: string;
  value: number;
  hint?: string;
  tone?: "blue" | "green" | "purple" | "orange" | "yellow" | "rose";
  delay?: number;
}

const palettes: Record<NonNullable<Props["tone"]>, { glow: string; chip: string }> = {
  blue:   { glow: "from-sky-500/20 to-transparent", chip: "bg-sky-500/15 text-sky-500" },
  green:  { glow: "from-emerald-500/20 to-transparent", chip: "bg-emerald-500/15 text-emerald-500" },
  purple: { glow: "from-violet-500/20 to-transparent", chip: "bg-violet-500/15 text-violet-500" },
  orange: { glow: "from-orange-500/20 to-transparent", chip: "bg-orange-500/15 text-orange-500" },
  yellow: { glow: "from-amber-500/20 to-transparent", chip: "bg-amber-500/15 text-amber-500" },
  rose:   { glow: "from-rose-500/20 to-transparent", chip: "bg-rose-500/15 text-rose-500" },
};

export function CountUpStat({ icon: Icon, label, value, hint, tone = "blue", delay = 0 }: Props) {
  const p = palettes[tone];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-xl">
      <div className={cn("pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl transition-transform group-hover:scale-110", p.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-[40px] font-bold leading-none tracking-tight tabular-nums text-foreground">
            <CountUp end={value} duration={1.4} delay={delay} separator="," />
          </p>
          {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-current/20", p.chip)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
