"use client";

import { memo, useState } from "react";
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BadgeCheck,
  Clock, ShieldCheck, User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SerializedEmployee } from "@/lib/employee";

interface Props {
  employee: SerializedEmployee;
  pending: boolean;
  onMark: (direction: "IN" | "OUT") => void;
}

function EmployeeResultPanelInner({ employee, pending, onMark }: Props) {
  const inside = employee.currentStatus === "IN";
  const expiry = employee.idCardExpiresAt ? new Date(employee.idCardExpiresAt) : null;
  const validUntil = expiry ? expiry.toLocaleDateString("en-GB") : "—";

  /* Photo state — `idle` (still loading) | `ok` (loaded) | `error` (no photo / failed) */
  const [photoState, setPhotoState] = useState<"idle" | "ok" | "error">("idle");
  const photoMissing = photoState === "error" || !employee.photoUrl;

  const initials =
    employee.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-md sm:gap-6 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-base font-semibold uppercase tracking-wide sm:px-4 sm:py-2 sm:text-2xl " +
            (inside
              ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/40"
              : "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/40")
          }
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
          {inside ? "INSIDE SITE" : "OUTSIDE SITE"}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
          Employee · {employee.tradeType}
        </span>
      </div>

      {/* Photo + identity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <div className="relative mx-auto h-52 w-52 shrink-0 overflow-hidden rounded-xl border-2 border-border/60 bg-background ring-2 ring-[--color-brand-ocean]/30 shadow-lg sm:h-56 sm:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={employee.photoUrl /* re-fetch on every new scan */}
            src={employee.photoUrl}
            alt={employee.name}
            className={
              "h-full w-full object-cover transition-opacity duration-150 " +
              (photoState === "ok" ? "opacity-100" : "opacity-0")
            }
            onLoad={(e) => {
              const img = e.currentTarget;
              /* The 1×1 fallback gif is 1px wide — treat that as "no photo". */
              if (img.naturalWidth > 4 && img.naturalHeight > 4) {
                setPhotoState("ok");
              } else {
                setPhotoState("error");
              }
            }}
            onError={() => setPhotoState("error")}
          />
          {photoState !== "ok" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background">
              {photoState === "idle" ? (
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              ) : (
                <>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground">
                    {initials}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    No photo on file
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-[32px]">
              {employee.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground">
              {employee.nicNumber} · {employee.employeeId ?? "—"}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Item label="Contractor" value={employee.companyName} />
            <Item label="Designation" value={employee.designation || "—"} />
            <Item label="Trade" value={employee.tradeType} />
            <Item label="Blood Type" value={employee.bloodType || "Unknown"} />
          </dl>
          <div className="flex items-center gap-2 text-sm">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">Valid until</span>
            <span className="font-mono font-semibold">{validUntil}</span>
          </div>
        </div>
      </div>

      {/* Big warning banner when no photo is on file */}
      {photoMissing && photoState !== "idle" && (
        <div className="flex items-start gap-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300 sm:p-4">
          <AlertTriangle className="h-6 w-6 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wide sm:text-base">
              ⚠ NO PHOTO ON FILE
            </p>
            <p className="mt-0.5 text-xs sm:text-sm">
              Manual verification required — verify NIC against a physical document before marking IN.
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={pending || inside}
          onClick={() => onMark("IN")}
          aria-keyshortcuts="Space"
          title={inside ? "Already marked IN" : "Mark IN (Space)"}
          className={
            "h-20 rounded-2xl text-2xl font-bold tracking-wide text-white transition-all " +
            (inside
              ? "cursor-not-allowed bg-emerald-900/30 ring-1 ring-emerald-700/30 opacity-60"
              : "bg-emerald-600 ring-1 ring-emerald-500/40 hover:bg-emerald-500 active:scale-[0.98] shadow-lg shadow-emerald-600/30")
          }
        >
          <ArrowDownToLine className="mr-3 h-7 w-7" />
          MARK IN
        </Button>
        <Button
          type="button"
          disabled={pending || !inside}
          onClick={() => onMark("OUT")}
          aria-keyshortcuts="Backspace"
          title={!inside ? "Already OUT" : "Mark OUT (Backspace)"}
          className={
            "h-20 rounded-2xl text-2xl font-bold tracking-wide text-white transition-all " +
            (!inside
              ? "cursor-not-allowed bg-red-900/30 ring-1 ring-red-700/30 opacity-60"
              : "bg-red-600 ring-1 ring-red-500/40 hover:bg-red-500 active:scale-[0.98] shadow-lg shadow-red-600/30")
          }
        >
          <ArrowUpFromLine className="mr-3 h-7 w-7" />
          MARK OUT
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Status: {employee.status}
        </span>
        {employee.lastScanAt && (
          <span className="inline-flex items-center gap-1.5 font-mono">
            <Clock className="h-3.5 w-3.5" />
            last scan {new Date(employee.lastScanAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Reserved for hidden import sanity */}
      <User className="hidden" />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export const EmployeeResultPanel = memo(EmployeeResultPanelInner);
