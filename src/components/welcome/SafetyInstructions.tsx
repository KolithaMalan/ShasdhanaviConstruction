"use client";

import { motion } from "framer-motion";
import {
  HardHat,
  ShieldAlert,
  KeyRound,
  Users,
  type LucideIcon,
} from "lucide-react";

interface SafetyItem {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

const items: SafetyItem[] = [
  {
    icon: HardHat,
    title: "Wear PPE at all times",
    description:
      "Helmet, hi-vis vest, safety boots and any task-specific equipment are mandatory across the entire site.",
    accent: "from-orange-500/30 to-orange-500/0",
  },
  {
    icon: ShieldAlert,
    title: "Follow safety rules",
    description:
      "Adhere to posted signage, permit-to-work conditions and HSEQ officer instructions without exception.",
    accent: "from-red-500/30 to-red-500/0",
  },
  {
    icon: KeyRound,
    title: "Authorized access only",
    description:
      "Carry your gate pass at all times. Restricted zones require an additional clearance from Internal Security.",
    accent: "from-blue-500/30 to-blue-500/0",
  },
  {
    icon: Users,
    title: "Safety is everyone's responsibility",
    description:
      "Report unsafe acts or near-misses immediately. Looking out for each other keeps the project moving.",
    accent: "from-emerald-500/30 to-emerald-500/0",
  },
];

export function SafetyInstructions() {
  return (
    <section id="safety" className="relative border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-orange]">
            Site Safety
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Before you step on site
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Every contractor, employee and visitor agrees to these baseline
            safety commitments. They are non-negotiable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-6 backdrop-blur-md transition-shadow hover:shadow-xl hover:shadow-black/5"
            >
              <div
                className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${item.accent} blur-2xl transition-opacity group-hover:opacity-100 opacity-70`}
              />
              <div className="relative">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-background/60">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
