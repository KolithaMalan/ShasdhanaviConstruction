"use client";

import Link from "next/link";
import { AlertTriangle, Clock, FileText, Stethoscope, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface Props {
  alerts: {
    expiredIds: number;
    pendingRegistrations: number;
    pendingMedical: number;
    pendingInspections: number;
  } | null;
}

interface Alert {
  label: string; count: number; href: string; icon: typeof AlertTriangle; tone: string;
}

export function AlertsPanel({ alerts }: Props) {
  const items: Alert[] = alerts
    ? [
        { label: "Expired ID Cards",          count: alerts.expiredIds,           href: "/admin/expired-ids",     icon: Clock,        tone: "bg-rose-500/15 text-rose-500" },
        { label: "Pending Registrations",     count: alerts.pendingRegistrations, href: "/admin/registrations",   icon: FileText,     tone: "bg-amber-500/15 text-amber-500" },
        { label: "Pending Medical",           count: alerts.pendingMedical,       href: "/medical/screening",     icon: Stethoscope,  tone: "bg-sky-500/15 text-sky-500" },
        { label: "Pending Inspections",       count: alerts.pendingInspections,   href: "/hseq/electrical-inspection", icon: Zap, tone: "bg-emerald-500/15 text-emerald-500" },
      ]
    : [];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
      <h3 className="mb-3 font-heading text-base font-semibold">System Alerts</h3>
      {items.length === 0 ? (
        <div className="space-y-2">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((a, i) => (
            <motion.li key={a.label}
                       initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.04 }}>
              <Link href={a.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border/60 p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md",
                      a.count > 0 ? "bg-card/80" : "bg-background/40",
                    )}>
                <span className={"flex h-9 w-9 items-center justify-center rounded-lg " + a.tone}>
                  <a.icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{a.label}</span>
                <span className={cn(
                  "font-mono text-sm font-bold tabular-nums",
                  a.count > 0 ? "text-foreground" : "text-muted-foreground",
                )}>
                  {a.count}
                </span>
                {a.count > 0 && (
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                )}
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
