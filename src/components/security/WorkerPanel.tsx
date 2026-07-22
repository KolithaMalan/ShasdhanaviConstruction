"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, HardHat, Loader2, Lock, Package,
  Plus, RotateCcw, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkerInfo {
  id: string;
  name: string;
  company: string;
  designation: string;
  nicNumber: string;
  workerId: string;
  photoUrl: string;
  currentStatus: "IN" | "OUT";
}

interface Props {
  worker: WorkerInfo;
  openVisit: null | {
    id: string;
    items: { name: string; addedAt?: string | null }[];
    checkInAt: string | null;
  };
  gate: string;
  scanMethod: "QR_SCANNER" | "WEBCAM" | "MANUAL";
  onCompleted: () => void;
  onReset: () => void;
}

function initialsFor(name: string): string {
  return (
    name?.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
  );
}

/**
 * Yugadhanavi/Sobadhanavi worker gate panel. Handles attendance + item
 * tracking: on IN the officer records items brought in; on OUT the recorded
 * items are shown for verification (editable) before confirming, with a choice
 * to clear the record (final departure) or keep it as history.
 */
export function WorkerPanel({ worker, openVisit, gate, scanMethod, onCompleted, onReset }: Props) {
  const inside = worker.currentStatus === "IN";
  const direction: "IN" | "OUT" = inside ? "OUT" : "IN";

  /* Returning from lunch = already OUTside but has an OPEN record. */
  const returningWithRecord = direction === "IN" && !!openVisit;
  /* Items already on record — shown read-only while re-entering so the officer
     can see what's still on site with them before adding anything new. */
  const alreadyOnRecord = returningWithRecord ? openVisit.items.map((i) => i.name) : [];

  /* `items` is what this scan submits: on IN the items being carried in right
     now (appended to any existing record), on OUT the full list leaving. */
  const [items, setItems] = useState<string[]>(
    direction === "OUT" && openVisit ? openVisit.items.map((i) => i.name) : [],
  );
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();

  function addItem() {
    const v = draft.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setDraft("");
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function submit(final: boolean) {
    start(async () => {
      try {
        const payload =
          direction === "IN"
            ? {
                action: "IN",
                workerId: worker.id,
                /* Appended server-side when a record is already open. */
                items: items.map((name) => ({ name })),
                gateLocation: gate,
                scanMethod,
              }
            : {
                action: "OUT",
                workerId: worker.id,
                itemsTakenOut: items.map((name) => ({ name })),
                final,
                gateLocation: gate,
                scanMethod,
              };
        const res = await fetch("/api/security/worker-gate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Failed");
        toast.success(`Worker ${direction}`, { description: worker.name });
        onCompleted();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-l-4 border-[--color-brand-ocean] bg-linear-to-br from-[--color-brand-ocean]/10 via-card/70 to-card/70 p-6 ring-1 ring-[--color-brand-ocean]/25 backdrop-blur-md">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[--color-brand-sky]/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-[--color-brand-ocean]/15 px-4 py-2 text-xl font-bold uppercase tracking-wide text-[--color-brand-ocean] ring-1 ring-[--color-brand-ocean]/40">
          <HardHat className="h-6 w-6" />
          {worker.company} Worker
        </span>
        <span
          className={
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold uppercase tracking-wide " +
            (inside
              ? "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/40"
              : "bg-slate-500/15 text-slate-500 ring-1 ring-slate-500/40")
          }
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {inside ? "INSIDE SITE" : "OUTSIDE SITE"}
        </span>
      </div>

      <div className="relative mt-6 flex items-center gap-5">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-[--color-brand-ocean]/40 bg-background">
          {worker.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={worker.photoUrl} alt={worker.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-2xl font-bold text-muted-foreground">
              {initialsFor(worker.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-bold">{worker.name}</h2>
          <p className="mt-1 font-mono text-sm text-[--color-brand-ocean]">{worker.workerId}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {worker.designation || "—"} · {worker.nicNumber}
          </p>
        </div>
      </div>

      {/* ── Item tracking box ── */}
      <div className="relative mt-6 rounded-xl border border-border/60 bg-background/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-[--color-brand-ocean]" />
          <p className="text-sm font-semibold">
            {direction === "IN"
              ? returningWithRecord
                ? "Re-entry — add any NEW items"
                : "Items brought IN"
              : "Items taken OUT — verify against what came in"}
          </p>
        </div>

        {/* Already on record (re-entry only) — read-only reference. */}
        {returningWithRecord && (
          <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Already on record
              {openVisit.checkInAt
                ? ` · since ${new Date(openVisit.checkInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
            {alreadyOnRecord.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing was recorded earlier today.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {alreadyOnRecord.map((it, idx) => (
                  <li
                    key={`rec-${it}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1 text-sm text-muted-foreground"
                  >
                    <Lock className="h-3 w-3" />
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {direction === "OUT" && openVisit && (
          <p className="mb-3 text-[11px] text-muted-foreground">
            Recorded at check-in{openVisit.checkInAt ? ` · ${new Date(openVisit.checkInAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}.
            Remove any item that is <span className="font-semibold">not</span> leaving with the worker.
          </p>
        )}

        <div className="mb-3 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder={
              returningWithRecord
                ? "New item brought back — e.g. grinder, extension cord"
                : "e.g. Jack, fire extinguisher, chain, belt"
            }
            className="h-10"
          />
          <Button type="button" variant="outline" onClick={addItem} className="h-10 rounded-lg">
            <Plus className="mr-1.5 h-4 w-4" /> Add Item
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {returningWithRecord
              ? "No new items. Leave empty if the worker returns with nothing extra."
              : "No items added. Leave empty if the worker brings nothing."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((it, idx) => (
              <li
                key={`${it}-${idx}`}
                className={
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm " +
                  (returningWithRecord
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border/60 bg-card/70")
                }
              >
                {returningWithRecord && <Plus className="h-3 w-3" />}
                {it}
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${it}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Actions ── */}
      {direction === "IN" ? (
        <Button
          onClick={() => submit(false)}
          disabled={pending}
          className="relative mt-5 h-14 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowDownToLine className="mr-2 h-5 w-5" />}
          Mark IN
          {returningWithRecord
            ? items.length
              ? ` (returning · +${items.length} new item(s))`
              : " (returning)"
            : items.length
              ? ` · ${items.length} item(s)`
              : ""}
        </Button>
      ) : (
        <div className="relative mt-5 space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Use <span className="font-semibold">Lunch / temporary</span> if the worker will return today (items stay on record).
            Use <span className="font-semibold">Final departure</span> at end of day to close &amp; archive the record.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              onClick={() => submit(false)}
              disabled={pending}
              className="h-14 rounded-xl bg-amber-600 text-base font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
            >
              {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowUpFromLine className="mr-2 h-5 w-5" />}
              OUT · Lunch / temporary
            </Button>
            <Button
              onClick={() => submit(true)}
              disabled={pending}
              variant="outline"
              className="h-14 rounded-xl border-amber-600/50 text-base font-semibold text-amber-700 hover:bg-amber-600/10 disabled:opacity-40"
            >
              {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Trash2 className="mr-2 h-5 w-5" />}
              OUT · Final departure
            </Button>
          </div>
        </div>
      )}

      <Button onClick={onReset} variant="ghost" className="relative mt-3 h-11 w-full rounded-lg">
        <RotateCcw className="mr-2 h-4 w-4" /> Dismiss & Continue
      </Button>
    </div>
  );
}
