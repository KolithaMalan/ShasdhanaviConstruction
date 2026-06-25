"use client";

import {
  ArrowDownToLine, ArrowUpFromLine, BadgeCheck, Loader2,
  Infinity as InfinityIcon, RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  permanent: {
    id: string;
    name: string;
    designation: string;
    department: string;
    nicNumber: string;
    permanentId: string;
    photoUrl: string;
    currentStatus: "IN" | "OUT";
  };
  pending: boolean;
  onMark: (direction: "IN" | "OUT") => void;
  onReset: () => void;
}

function initialsFor(name: string): string {
  return (
    name?.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?"
  );
}

/** Distinctive gold/amber styling marks a permanent (staff) pass apart
 *  from regular contractor employees, vehicles and visitors. */
export function PermanentEmployeePanel({ permanent, pending, onMark, onReset }: Props) {
  const inside = permanent.currentStatus === "IN";

  return (
    <div className="relative overflow-hidden rounded-2xl border-l-4 border-amber-500 bg-linear-to-br from-amber-500/10 via-card/70 to-card/70 p-6 ring-1 ring-amber-500/30 backdrop-blur-md">
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-xl font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-500/50">
          <BadgeCheck className="h-6 w-6" />
          Permanent Staff
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
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-amber-500/40 bg-background ring-2 ring-amber-500/20">
          {permanent.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={permanent.photoUrl} alt={permanent.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-3xl font-bold text-muted-foreground">
              {initialsFor(permanent.name)}
            </div>
          )}
        </div>
        <div>
          <h2 className="font-heading text-3xl font-bold">{permanent.name}</h2>
          <p className="mt-1 font-mono text-sm text-amber-600">{permanent.permanentId}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <InfinityIcon className="h-3.5 w-3.5" /> Permanent · No Expiry
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-4">
        <Field label="Designation" value={permanent.designation} />
        <Field label="Department" value={permanent.department} />
        <Field label="NIC" value={permanent.nicNumber} mono />
        <Field label="Status" value={inside ? "Inside site" : "Outside site"} />
      </div>

      {/* IN / OUT actions */}
      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <Button
          onClick={() => onMark("IN")}
          disabled={pending || inside}
          className="h-14 rounded-xl bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowDownToLine className="mr-2 h-5 w-5" />}
          Mark IN
        </Button>
        <Button
          onClick={() => onMark("OUT")}
          disabled={pending || !inside}
          className="h-14 rounded-xl bg-amber-600 text-base font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {pending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowUpFromLine className="mr-2 h-5 w-5" />}
          Mark OUT
        </Button>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="relative mt-3 h-11 w-full rounded-lg"
      >
        <RotateCcw className="mr-2 h-4 w-4" /> Dismiss & Continue
      </Button>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold text-foreground ${mono ? "font-mono text-sm" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}
