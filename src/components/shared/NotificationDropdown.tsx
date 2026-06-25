"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

function timeAgo(d: string | Date): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d2 = Math.floor(hr / 24);
  if (d2 < 7) return `${d2}d ago`;
  return date.toLocaleDateString("en-GB");
}

const typeStyles: Record<string, string> = {
  REGISTRATION_SUBMITTED: "bg-amber-500/15 text-amber-500",
  REGISTRATION_APPROVED: "bg-emerald-500/15 text-emerald-500",
  REGISTRATION_REJECTED: "bg-red-500/15 text-red-500",
  CORRECTIONS_REQUESTED: "bg-amber-500/15 text-amber-500",
  ADDITIONAL_REQUEST_SUBMITTED: "bg-sky-500/15 text-sky-500",
  ADDITIONAL_REQUEST_APPROVED: "bg-emerald-500/15 text-emerald-500",
  ADDITIONAL_REQUEST_REJECTED: "bg-red-500/15 text-red-500",
  ACCOUNT_CREATED: "bg-indigo-500/15 text-indigo-500",
  MEDICAL_PASSED: "bg-emerald-500/15 text-emerald-500",
  MEDICAL_FAILED: "bg-red-500/15 text-red-500",
  INDUCTION_COMPLETED: "bg-emerald-500/15 text-emerald-500",
  ID_EXPIRED: "bg-slate-500/15 text-slate-500",
  ID_REACTIVATED: "bg-emerald-500/15 text-emerald-500",
  EQUIPMENT_INSPECTION_PASSED: "bg-emerald-500/15 text-emerald-500",
  EQUIPMENT_INSPECTION_FAILED: "bg-red-500/15 text-red-500",
  GATE_PASS_PROCESSED: "bg-sky-500/15 text-sky-500",
  SYSTEM_ALERT: "bg-amber-500/15 text-amber-500",
};

export function NotificationDropdown() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [busy, setBusy] = useState(false);

  /* Poll unread count every 15s */
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const body = await res.json();
        if (!cancelled) setUnread(Number(body.count) || 0);
      } catch { /* ignore */ }
    }
    tick();
    const t = window.setInterval(tick, 15_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!open) return;
    setItems(null);
    fetch("/api/notifications?limit=10")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, [open]);

  async function markAllRead() {
    setBusy(true);
    try {
      await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
      setUnread(0);
    } finally { setBusy(false); }
  }

  async function clickNotification(n: Notification) {
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) window.location.href = n.link;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 active:scale-[0.96]"
        >
          <Bell className="h-4 w-4 text-foreground" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -right-1 -top-1"
              >
                <Badge className="h-4 min-w-4 rounded-full border-2 border-background bg-[--color-brand-orange] p-0 px-1 text-[9px] font-semibold text-white animate-pulse">
                  {unread > 99 ? "99+" : unread}
                </Badge>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-[400px] max-w-[90vw] rounded-xl border-border/60 bg-card/95 p-0 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="font-heading text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread === 0 ? "All caught up" : `${unread} unread`}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={markAllRead} disabled={busy || unread === 0}
                  className="h-8 text-xs">
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {items === null ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <Bell className="h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No notifications yet</p>
              <p className="mt-1 text-xs text-muted-foreground">You'll see system events here.</p>
            </div>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => clickNotification(n)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/10",
                      !n.read && "bg-[--color-brand-ocean]/5",
                    )}
                  >
                    <span className="relative mt-1 flex h-2 w-2 shrink-0">
                      {!n.read && <span className="absolute inline-flex h-full w-full rounded-full bg-[--color-brand-ocean]/60" />}
                      <span className={cn(
                        "relative inline-flex h-2 w-2 rounded-full",
                        n.read ? "bg-transparent" : "bg-[--color-brand-ocean]",
                      )} />
                    </span>
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-mono uppercase tracking-wider",
                      typeStyles[n.type] ?? "bg-muted text-muted-foreground",
                    )}>
                      {n.type.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={cn("truncate text-sm", n.read ? "font-medium" : "font-semibold")}>{n.title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    </div>
                    {n.link && <ChevronRight className="mt-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link href="/notifications" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 border-t border-border/60 py-2.5 text-xs font-medium text-[--color-brand-ocean] hover:bg-accent/10">
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          View all notifications <Check className="h-3 w-3 opacity-0" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
