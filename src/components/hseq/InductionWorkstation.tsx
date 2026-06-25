"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, CheckCircle2, ClipboardCheck, IdCard, Loader2, Search, User, Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { WebcamCaptureDialog } from "@/components/hseq/WebcamCaptureDialog";
import { cn } from "@/lib/utils";
import type { SerializedEmployee } from "@/lib/employee";

export function InductionWorkstation() {
  const router = useRouter();
  const [items, setItems] = useState<SerializedEmployee[] | null>(null);
  const [q, setQ] = useState("");
  const [contractor, setContractor] = useState<string>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [pending, start] = useTransition();

  const selected = items?.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (contractor !== "ALL") params.set("contractor", contractor);
    setLoading(true);
    fetch(`/api/hseq/employees/pending-induction?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, contractor]);

  const contractors = useMemo(() => {
    if (!items) return [];
    const set = new Set(items.map((e) => e.companyName).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  /**
   * Keyed by employee id — the most recent capture's local base64 data URL.
   * We prefer this for the in-session preview because it is guaranteed to
   * render correctly the moment capture completes, no server roundtrip needed.
   * (The server URL is still stored on the employee record for future loads.)
   */
  const [localPhotos, setLocalPhotos] = useState<Record<string, string>>({});

  function updateSelectedPhoto(photoUrl: string, localDataUrl?: string) {
    if (!selected) return;
    /* Append a cache-buster so the <img> refetches even when the canonical
       URL didn't change (eg. on retake). The API serves the photo with
       Cache-Control: immutable so we'd otherwise see the stale image. */
    const busted = photoUrl.includes("?")
      ? `${photoUrl}&t=${Date.now()}`
      : `${photoUrl}?t=${Date.now()}`;
    setItems((prev) =>
      prev
        ? prev.map((e) =>
            e.id === selected.id ? { ...e, photoUrl: busted, hasPhoto: true } : e,
          )
        : prev,
    );
    if (localDataUrl) {
      setLocalPhotos((prev) => ({ ...prev, [selected.id]: localDataUrl }));
    }
  }

  /** Prefer the just-captured local data URL when present; otherwise fall
      back to the server URL. */
  const previewSrc = selected
    ? localPhotos[selected.id] || selected.photoUrl || ""
    : "";

  function completeInduction() {
    if (!selected) return;
    start(async () => {
      const res = await fetch(`/api/hseq/employees/${selected.id}/complete-induction`, { method: "POST" });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(b.message ?? "Failed"); return; }
      toast.success("Induction complete — ID card generated");
      router.push(`/hseq/id-card/${b.employeeId}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT — Employee list */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md lg:col-span-5 xl:col-span-4">
        <div className="space-y-3 border-b border-border/60 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search name or NIC…" className="h-10 pl-9" />
          </div>
          {contractors.length > 0 && (
            <Select value={contractor} onValueChange={setContractor}>
              <SelectTrigger><SelectValue placeholder="All contractors" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All contractors</SelectItem>
                {contractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-2 p-3">
            {items === null ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
            ) : items.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {loading ? "Loading…" : "No employees awaiting induction."}
              </div>
            ) : (
              items.map((e) => {
                const active = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                      "hover:border-border hover:bg-accent/10",
                      active
                        ? "border-[--color-brand-ocean]/60 bg-[--color-brand-ocean]/10"
                        : "border-border/60 bg-background/50",
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-muted-foreground">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{e.name}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{e.nicNumber}</div>
                      <div className="mt-1 truncate text-[11px] text-muted-foreground">
                        {e.companyName} · {e.tradeType}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT — Selected employee detail */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md lg:col-span-7 xl:col-span-8">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="p-6">
              <EmptyState
                icon={ClipboardCheck}
                title="Select an employee to start induction"
                description="Pick an employee from the list to view their details, capture a photo, and issue an ID card."
              />
            </motion.div>
          ) : (
            <motion.div key={selected.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-6 p-5 sm:p-6">
              {/* Header */}
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={previewSrc}
                      src={previewSrc}
                      alt={selected.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <User className="h-9 w-9" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                    Pending Induction
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold">{selected.name}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{selected.nicNumber}</p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Item label="Contractor" value={selected.companyName} />
                <Item label="Trade" value={selected.tradeType} />
                <Item label="Designation" value={selected.designation || "—"} />
                <Item label="Blood Type" value={selected.bloodType || "Unknown"} />
                <Item label="Mobile" value={selected.mobileNumber || "—"} mono />
                <Item label="Emergency Contact" value={selected.emergencyContact || "—"} mono />
              </dl>

              {/* ── Photo preview card ──────────────────────── */}
              <div className="rounded-xl border border-border/60 bg-background/40 p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Photo</p>

                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Large preview area — 192×192, always visible */}
                  <div
                    className={cn(
                      "relative h-48 w-48 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                      previewSrc
                        ? "border-emerald-500/60 bg-background"
                        : "border-dashed border-border bg-muted/30",
                    )}
                  >
                    {previewSrc ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={previewSrc}
                          src={previewSrc}
                          alt={selected.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-background">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                        <User className="h-12 w-12 text-muted-foreground/60" />
                        <span className="text-xs font-medium text-muted-foreground">
                          No photo captured yet
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right side — status text + action button */}
                  <div className="flex-1 space-y-3">
                    {selected.photoUrl ? (
                      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Photo Captured
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                        <Users className="h-4 w-4" />
                        Awaiting photo capture
                      </div>
                    )}

                    <WebcamCaptureDialog
                      employeeId={selected.id}
                      onSaved={updateSelectedPhoto}
                      trigger={
                        selected.photoUrl ? (
                          <Button variant="outline" className="rounded-lg">
                            <Camera className="mr-2 h-4 w-4" /> Retake Photo
                          </Button>
                        ) : (
                          <Button className="h-12 w-full rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90 active:scale-[0.98] sm:w-auto">
                            <Camera className="mr-2 h-5 w-5" /> Open Webcam to Capture Photo
                          </Button>
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ── Complete induction CTA + hint ───────────── */}
              <div className="space-y-2">
                <Button
                  onClick={() => setCompleteOpen(true)}
                  disabled={!selected.photoUrl || pending}
                  aria-disabled={!selected.photoUrl || pending}
                  className={cn(
                    "h-12 w-full rounded-lg text-white transition-all",
                    selected.photoUrl && !pending
                      ? "bg-emerald-600 hover:bg-emerald-600/90 active:scale-[0.98]"
                      : "pointer-events-none cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted",
                  )}
                >
                  <IdCard className="mr-2 h-5 w-5" /> COMPLETE INDUCTION &amp; GENERATE ID CARD
                </Button>

                {!selected.photoUrl && (
                  <div className="flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    <span aria-hidden>⚠️</span>
                    <span>Please capture employee photo before completing induction</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete induction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will issue an ID card for {selected?.name} valid for 2 months.
              The employee will become ACTIVE on site immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); completeInduction(); }}
              disabled={pending}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Issue ID Card
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}
