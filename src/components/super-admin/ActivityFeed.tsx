"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, CheckCircle2, ClipboardCheck, DownloadCloud,
  IdCard, KeyRound, LogIn, LogOut, RefreshCw, ScanLine, ShieldAlert,
  Stethoscope, UserCog, UserPlus, XCircle, Zap, Wrench,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  description: string;
  userName: string;
  userRole: string;
  createdAt: string;
}

const ICONS: Record<string, typeof Activity> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE: UserPlus,
  UPDATE: UserCog,
  DELETE: XCircle,
  APPROVE: CheckCircle2,
  REJECT: XCircle,
  SCAN_IN: ScanLine,
  SCAN_OUT: ScanLine,
  UPLOAD_PHOTO: IdCard,
  DOWNLOAD_REPORT: DownloadCloud,
  PASSWORD_CHANGE: KeyRound,
  SETTING_CHANGE: UserCog,
  ACCOUNT_CREATE: UserPlus,
  REACTIVATE_ID: RefreshCw,
  BLOCK_USER: ShieldAlert,
  UNBLOCK_USER: CheckCircle2,
  GATE_PASS: Wrench,
  MEDICAL_PASS: Stethoscope,
  MEDICAL_FAIL: XCircle,
  INSPECTION_PASS: Zap,
  INSPECTION_FAIL: AlertTriangle,
};

const TONES: Record<string, string> = {
  LOGIN: "bg-sky-500/10 text-sky-500",
  CREATE: "bg-emerald-500/10 text-emerald-500",
  APPROVE: "bg-emerald-500/10 text-emerald-500",
  REJECT: "bg-red-500/10 text-red-500",
  DELETE: "bg-red-500/10 text-red-500",
  BLOCK_USER: "bg-red-500/10 text-red-500",
  UNBLOCK_USER: "bg-emerald-500/10 text-emerald-500",
  MEDICAL_PASS: "bg-emerald-500/10 text-emerald-500",
  MEDICAL_FAIL: "bg-red-500/10 text-red-500",
  INSPECTION_PASS: "bg-emerald-500/10 text-emerald-500",
  INSPECTION_FAIL: "bg-red-500/10 text-red-500",
  SCAN_IN: "bg-sky-500/10 text-sky-500",
  SCAN_OUT: "bg-amber-500/10 text-amber-500",
  DOWNLOAD_REPORT: "bg-violet-500/10 text-violet-500",
  PASSWORD_CHANGE: "bg-amber-500/10 text-amber-500",
  SETTING_CHANGE: "bg-amber-500/10 text-amber-500",
  GATE_PASS: "bg-sky-500/10 text-sky-500",
  UPLOAD_PHOTO: "bg-violet-500/10 text-violet-500",
};

function timeAgo(d: string): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/super-admin/activity-feed?limit=40");
        const b = await res.json();
        if (!cancelled) setItems(b.items ?? []);
      } catch { /* ignore */ }
    }
    load();
    const t = window.setInterval(load, 10_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold">Live Activity Feed</h3>
          <p className="text-[11px] text-muted-foreground">Refreshes every 10s</p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-500">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      {items === null ? (
        <div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
      ) : items.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No activity yet</div>
      ) : (
        <ul className="max-h-[480px] space-y-1.5 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {items.map((it) => {
              const Icon = ICONS[it.action] ?? Activity;
              const tone = TONES[it.action] ?? "bg-muted text-muted-foreground";
              return (
                <motion.li
                  key={it.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-md " + tone}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{it.description || it.action}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium">{it.userName || "system"}</span>
                      {" · "}{it.userRole.replace(/_/g, " ").toLowerCase()}
                      {" · "}<span className="font-mono">{timeAgo(it.createdAt)}</span>
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
