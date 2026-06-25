"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Loader2, Search, XCircle, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { SerializedElectricalEquipment } from "@/lib/tools";

export function ElectricalInspectionWorkstation() {
  const router = useRouter();
  const [items, setItems] = useState<SerializedElectricalEquipment[] | null>(null);
  const [q, setQ] = useState("");
  const [contractor, setContractor] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [failReason, setFailReason] = useState("");
  const [passOpen, setPassOpen] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [pending, start] = useTransition();

  function load() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (contractor !== "ALL") params.set("contractor", contractor);
    setLoading(true);
    fetch(`/api/hseq/electrical/pending?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = window.setTimeout(load, 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, contractor]);

  const selected = items?.find((i) => i.id === selectedId) ?? null;

  const grouped = useMemo(() => {
    if (!items) return new Map<string, SerializedElectricalEquipment[]>();
    const map = new Map<string, SerializedElectricalEquipment[]>();
    for (const it of items) {
      const arr = map.get(it.companyName) ?? [];
      arr.push(it);
      map.set(it.companyName, arr);
    }
    return map;
  }, [items]);

  const contractors = useMemo(() => Array.from(grouped.keys()).sort(), [grouped]);

  function reset() {
    setSelectedId(null);
    setInspectionNotes("");
    setFailReason("");
  }

  function callPass() {
    if (!selected) return;
    start(async () => {
      const res = await fetch(`/api/hseq/electrical/${selected.id}/pass`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionNotes: inspectionNotes.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("Equipment passed", { description: "Safety + QR stickers can now be issued." });
      setPassOpen(false);
      router.push(`/hseq/electrical-equipment/${selected.id}/qr-sticker`);
    });
  }

  function callFail() {
    if (!selected) return;
    if (failReason.trim().length < 3) { toast.error("Provide a failure reason"); return; }
    start(async () => {
      const res = await fetch(`/api/hseq/electrical/${selected.id}/fail`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: failReason.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success("Equipment marked failed", { description: "Item is now blocked from site." });
      setFailOpen(false);
      reset();
      load();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT — pending equipment list */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md lg:col-span-5 xl:col-span-4">
        <div className="space-y-3 border-b border-border/60 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Search tool name, ID, serial…"
                   value={q} onChange={(e) => setQ(e.target.value)} />
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
          <div className="space-y-4 p-3">
            {items === null ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : items.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {loading ? "Loading…" : "No equipment awaiting inspection."}
              </div>
            ) : (
              Array.from(grouped.entries()).map(([company, arr]) => (
                <div key={company} className="space-y-1.5">
                  <p className="px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {company} ({arr.length})
                  </p>
                  {arr.map((e) => {
                    const active = e.id === selectedId;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => { setSelectedId(e.id); setInspectionNotes(""); setFailReason(""); }}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all",
                          "hover:border-border hover:bg-accent/10",
                          active
                            ? "border-[--color-brand-ocean]/60 bg-[--color-brand-ocean]/10"
                            : "border-border/60 bg-background/50",
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background text-[--color-brand-ocean]">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{e.toolName}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{e.equipmentId}</div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">
                            {e.category || "—"} · Qty {e.quantity}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT — selected item */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md lg:col-span-7 xl:col-span-8">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <EmptyState
                icon={Zap}
                title="Select equipment from the list to begin inspection"
                description="Each item shows tool name, ID, category and quantity. Pick one to record your findings."
              />
            </motion.div>
          ) : (
            <motion.div key={selected.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="space-y-6 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                    Pending Inspection
                  </p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold">{selected.toolName}</h2>
                  <p className="font-mono text-xs text-muted-foreground">{selected.equipmentId}</p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Item label="Contractor" value={selected.companyName} />
                <Item label="Category" value={selected.category || "—"} />
                <Item label="Quantity" value={String(selected.quantity)} />
                <Item label="Serial Number" value={selected.serialNumber || "—"} mono />
                <Item label="Power Details" value={selected.powerDetails || "—"} />
                <Item label="Registered" value={selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-GB") : "—"} />
              </dl>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Inspection Notes (optional)
                </Label>
                <Textarea
                  id="notes" rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Insulation OK, earthing verified, casing intact…"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button onClick={() => setPassOpen(true)} disabled={pending}
                        className="h-16 rounded-2xl bg-emerald-600 text-lg font-bold tracking-wide text-white ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 active:scale-[0.98]">
                  <CheckCircle2 className="mr-2 h-5 w-5" /> MARK AS PASSED
                </Button>
                <Button onClick={() => setFailOpen(true)} disabled={pending}
                        className="h-16 rounded-2xl bg-red-600 text-lg font-bold tracking-wide text-white ring-1 ring-red-500/40 shadow-lg shadow-red-600/30 hover:bg-red-500 active:scale-[0.98]">
                  <XCircle className="mr-2 h-5 w-5" /> MARK AS FAILED
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={passOpen} onOpenChange={setPassOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve electrical equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.toolName} ({selected?.equipmentId}) will move into inventory and be valid for 6 months. You'll be taken to the sticker download page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); callPass(); }}
                               disabled={pending}
                               className="bg-emerald-600 text-white hover:bg-emerald-600/90">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirm pass
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={failOpen} onOpenChange={setFailOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will block the item from entering site. Provide a clear failure reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Failure reason (required)</Label>
            <Textarea rows={4} value={failReason} onChange={(e) => setFailReason(e.target.value)}
                      placeholder="Damaged insulation / no earth / power-test failure…" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); callFail(); }}
                               disabled={pending || failReason.trim().length < 3}
                               className="bg-red-600 text-white hover:bg-red-600/90">
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject & block
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
      <dd className={"mt-0.5 text-sm font-medium text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}
