import type { LucideIcon } from "lucide-react";
import { Activity, ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { PageHeader } from "@/components/shared/PageHeader";

interface PlaceholderModuleProps {
  eyebrow: string;
  title: string;
  description: string;
  phase: string;
  modules: { icon: LucideIcon; title: string; description: string }[];
}

export function PlaceholderModule({
  eyebrow,
  title,
  description,
  phase,
  modules,
}: PlaceholderModuleProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <MotionWrapper>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={
            <Badge
              variant="secondary"
              className="rounded-md border border-[--color-brand-orange]/30 bg-[--color-brand-orange]/10 text-[--color-brand-orange]"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {phase}
            </Badge>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur-md">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl" />
          <div className="relative flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6b1a] to-[#0a2540] text-white shadow-lg shadow-orange-500/20">
              <Activity className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-heading text-xl font-semibold">
                Module coming in {phase}
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                The authentication and role-based shell is live. The detailed
                workflows for this role will be enabled in the next phase of
                the rollout.
              </p>
            </div>
          </div>
        </div>
      </MotionWrapper>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, i) => (
          <MotionWrapper key={m.title} delay={0.1 + i * 0.05}>
            <div className="group h-full rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-border hover:shadow-xl hover:shadow-black/5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                <m.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-heading text-base font-semibold">{m.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {m.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <span>Planned</span>
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </MotionWrapper>
        ))}
      </div>
    </div>
  );
}
