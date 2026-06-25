"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
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

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [pending, start] = useTransition();
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams({ limit: "50" });
    if (filter === "UNREAD") params.set("read", "false");
    if (filter === "READ") params.set("read", "true");
    setLoading(true);
    fetch(`/api/notifications?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, [filter]);

  function markAllRead() {
    start(async () => {
      const res = await fetch("/api/notifications/mark-all-read", { method: "PATCH" });
      if (!res.ok) { toast.error("Failed"); return; }
      toast.success("All notifications marked read");
      load();
    });
  }

  function markRead(id: string) {
    start(async () => {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          description="System events delivered to you."
          actions={
            <Button onClick={markAllRead} variant="outline" disabled={pending}
                    className="rounded-lg">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
              Mark all read
            </Button>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="UNREAD">Unread</TabsTrigger>
            <TabsTrigger value="READ">Read</TabsTrigger>
          </TabsList>
        </Tabs>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={Bell} title={loading ? "Loading…" : "No notifications"} description="You're all caught up." />
         ) : (
          <div className="space-y-2">
            {items.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-border/60 p-4 backdrop-blur-md",
                    n.read ? "bg-card/40" : "bg-[--color-brand-ocean]/5 border-[--color-brand-ocean]/30",
                  )}
                >
                  <span className={cn(
                    "mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full",
                    n.read ? "bg-muted-foreground/30" : "bg-[--color-brand-ocean]",
                  )} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={cn("font-heading text-base", n.read ? "font-semibold" : "font-bold")}>
                        {n.title}
                      </h3>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        {n.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      {n.link && (
                        <Link href={n.link} className="text-xs font-medium text-[--color-brand-ocean] hover:underline">
                          Open →
                        </Link>
                      )}
                      {!n.read && (
                        <button type="button" onClick={() => markRead(n.id)}
                                className="text-xs text-muted-foreground hover:text-foreground">
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
         )}
      </MotionWrapper>
    </div>
  );
}
