"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  label: string;
  short: string;
}

interface StepperProps {
  steps: Step[];
  current: number;
  completed: number[];
  onJump: (stepId: number) => void;
}

export function Stepper({ steps, current, completed, onJump }: StepperProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-md sm:p-6">
      <ol className="grid grid-cols-6 gap-2">
        {steps.map((step) => {
          const isCurrent = step.id === current;
          const isDone = completed.includes(step.id);
          const isClickable = isDone || step.id < current;

          return (
            <li key={step.id} className="flex flex-col">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onJump(step.id)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-lg px-1 py-2 text-center transition-all",
                  isClickable && "cursor-pointer hover:bg-accent/10",
                  !isClickable && "cursor-default",
                )}
              >
                <div className="relative flex h-9 w-9 items-center justify-center">
                  {isDone && (
                    <motion.span
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/40 text-emerald-500"
                    >
                      <Check className="h-4 w-4" />
                    </motion.span>
                  )}
                  {!isDone && (
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors",
                        isCurrent
                          ? "bg-[--color-brand-ocean] text-white ring-[--color-brand-ocean]/50 shadow-lg shadow-[--color-brand-ocean]/30"
                          : "bg-background ring-border text-muted-foreground",
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                  {isCurrent && (
                    <motion.span
                      layoutId="step-halo"
                      className="absolute -inset-1 rounded-full ring-2 ring-[--color-brand-sky]/40"
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          animate={{ width: `${((current - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-gradient-to-r from-[--color-brand-ocean] to-[--color-brand-sky]"
        />
      </div>
    </div>
  );
}
