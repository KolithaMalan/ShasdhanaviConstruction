"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle, Ban, Camera, CheckCircle2, Droplet, Hash, IdCard, Keyboard,
  Loader2, Package, RotateCcw, Search, ShieldAlert, User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const WebcamQrScanner = dynamic(
  () => import("@/components/security/WebcamQrScanner"),
  { ssr: false, loading: () => <Skeleton className="mx-auto aspect-square w-full max-w-md rounded-2xl" /> },
);

interface Person {
  name: string;
  photoUrl: string;
  nicNumber: string;
  identifier: string;
  contractor: string;
  trade: string;
  designation: string;
  bloodType: string;
  firstDeployedAt: string | null;
  joinedDate: string | null;
  status: string;
  medicalStatus: string | null;
  idCardExpiresAt: string | null;
  currentStatus: "IN" | "OUT";
  blacklisted: boolean;
}

/** Open item record — Yuga/Soba workers only, absent for the other kinds. */
interface Visit {
  checkInAt: string | null;
  gateLocation: string;
  items: { name: string; addedAt: string | null }[];
}

type Result =
  | { kind: "EMPLOYEE" | "PERMANENT" | "WORKER"; person: Person; visit?: Visit | null }
  | { kind: "ERROR"; code: string; message: string };

const KIND_LABEL: Record<string, string> = {
  EMPLOYEE: "Contractor Employee",
  PERMANENT: "Permanent Employee",
  WORKER: "Yuga / Soba Worker",
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function initialsFor(name: string): string {
  return name?.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

/**
 * On-site identity spot check for the HSEQ Officer / Admin-HSEQ.
 *
 * Camera-first because this is used walking the site on a phone; manual entry
 * is the fallback when a QR is damaged or the camera is refused. Read-only —
 * nothing here marks anyone IN or OUT.
 */
export function IdVerifyWorkstation() {
  const [mode, setMode] = useState<"CAMERA" | "MANUAL">("CAMERA");
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [pending, start] = useTransition();
  const busyRef = useRef(false);

  const lookup = useCallback((qrData: string) => {
    const value = qrData.trim();
    if (!value || busyRef.current) return;
    busyRef.current = true;

    start(async () => {
      try {
        const res = await fetch("/api/hseq/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrData: value }),
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          setResult({
            kind: "ERROR",
            code: "REQUEST_FAILED",
            message: body?.message ?? "Lookup failed. Check your connection.",
          });
          return;
        }
        setResult(body as Result);
        if (navigator.vibrate) navigator.vibrate(60);
      } catch {
        setResult({
          kind: "ERROR",
          code: "OFFLINE",
          message: "Could not reach the server. Check your mobile signal.",
        });
      } finally {
        busyRef.current = false;
      }
    });
  }, []);

  function reset() {
    setResult(null);
    setManual("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* ── Mode switch ── */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-card/60 p-1.5 backdrop-blur-md">
        {(["CAMERA", "MANUAL"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setResult(null); }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-all active:scale-[0.98]",
              mode === m
                ? "bg-[--color-brand-ocean] text-white shadow-sm"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            )}
          >
            {m === "CAMERA" ? <Camera className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
            {m === "CAMERA" ? "Scan QR" : "Type ID / NIC"}
          </button>
        ))}
      </div>

      {/* ── Input ── */}
      {mode === "CAMERA" ? (
        <div className="space-y-3">
          <WebcamQrScanner onResult={lookup} paused={pending || !!result} />
          <p className="text-center text-xs text-muted-foreground">
            Hold the person&rsquo;s ID card QR inside the frame. Works with your
            phone camera or a desktop webcam.
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); lookup(manual); } }}
            placeholder="SHA-2026-XXXXX, PERM-…, WRK-… or NIC"
            className="h-12 text-base"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            onClick={() => lookup(manual)}
            disabled={pending || !manual.trim()}
            className="h-12 shrink-0 rounded-lg bg-[--color-brand-ocean] px-5 text-white hover:bg-[--color-brand-ocean]/90"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {pending && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking…
        </div>
      )}

      {/* ── Result ── */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.kind === "ERROR" ? `err-${result.code}` : result.person.identifier}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {result.kind === "ERROR" ? (
              <div className="rounded-2xl border-l-4 border-destructive bg-destructive/5 p-6 ring-1 ring-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                  <p className="font-heading text-lg font-bold uppercase tracking-wide">
                    Not verified
                  </p>
                </div>
                <p className="mt-3 text-sm">{result.message}</p>
                <Button onClick={reset} variant="outline" className="mt-5 h-12 w-full rounded-lg">
                  <RotateCcw className="mr-2 h-4 w-4" /> Scan another
                </Button>
              </div>
            ) : (
              <PersonCard
                kind={result.kind}
                person={result.person}
                visit={result.visit ?? null}
                onReset={reset}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonCard({
  kind, person, visit, onReset,
}: { kind: string; person: Person; visit: Visit | null; onReset: () => void }) {
  /* Anything other than an active, medically-cleared, unexpired record is
     worth flagging to the officer standing in front of the person. */
  const expired = !!person.idCardExpiresAt && new Date(person.idCardExpiresAt) < new Date();
  const alerts: string[] = [];
  if (person.blacklisted) alerts.push("NIC is BLACKLISTED");
  if (person.status === "BLOCKED") alerts.push("Record is BLOCKED");
  if (person.status === "MEDICAL_REJECTED") alerts.push("Medical REJECTED");
  if (person.status === "DEACTIVATED" || expired) alerts.push("ID card EXPIRED");
  if (person.medicalStatus === "PENDING") alerts.push("Medical clearance PENDING");
  const clean = alerts.length === 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border-l-4 bg-card/70 p-5 ring-1 backdrop-blur-md sm:p-6",
        clean
          ? "border-emerald-500 ring-emerald-500/20"
          : "border-destructive ring-destructive/25",
      )}
    >
      {/* Verdict strip */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-base font-bold uppercase tracking-wide ring-1",
            clean
              ? "bg-emerald-500/15 text-emerald-600 ring-emerald-500/40"
              : "bg-destructive/10 text-destructive ring-destructive/40",
          )}
        >
          {clean ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          {clean ? "Verified" : "Check required"}
        </span>
        <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {KIND_LABEL[kind] ?? kind}
        </span>
      </div>

      {alerts.length > 0 && (
        <ul className="mb-5 space-y-1.5">
          {alerts.map((a) => (
            <li
              key={a}
              className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
            >
              <Ban className="h-4 w-4 shrink-0" /> {a}
            </li>
          ))}
        </ul>
      )}

      {/* Identity */}
      <div className="flex items-start gap-4">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-border/60 bg-background sm:h-32 sm:w-32">
          {person.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-heading text-3xl font-bold text-muted-foreground">
              {initialsFor(person.name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-2xl font-bold leading-tight">{person.name}</h2>
          <p className="mt-1 font-mono text-sm text-[--color-brand-ocean]">{person.identifier}</p>
          <span
            className={cn(
              "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              person.currentStatus === "IN"
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-slate-500/15 text-slate-500",
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {person.currentStatus === "IN" ? "Inside site" : "Outside site"}
          </span>
        </div>
      </div>

      {/* Details */}
      <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2">
        <Field icon={IdCard} label="First deployed" value={fmtDate(person.firstDeployedAt)} hint="Medical clearance date" />
        <Field icon={Hash} label="NIC" value={person.nicNumber} mono />
        <Field icon={User} label="Contractor" value={person.contractor} />
        <Field icon={User} label="Trade" value={person.trade} />
        <Field icon={User} label="Designation" value={person.designation} />
        <Field icon={Droplet} label="Blood type" value={person.bloodType} emphasis />
      </dl>

      {/* Items the worker carried in and has not yet signed out (workers only). */}
      {kind === "WORKER" && (
        <div className="mt-5 rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Package className="h-4 w-4 text-[--color-brand-ocean]" />
            <p className="text-sm font-semibold">Items brought into site</p>
            {visit?.items.length ? (
              <span className="rounded-md bg-[--color-brand-ocean]/15 px-2 py-0.5 text-[10px] font-bold text-[--color-brand-ocean]">
                {visit.items.length}
              </span>
            ) : null}
          </div>

          {!visit ? (
            <p className="text-xs text-muted-foreground">
              No open gate record — this worker has not checked in today, or the
              record was closed at final departure.
            </p>
          ) : visit.items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Checked in{visit.checkInAt ? ` at ${fmtTime(visit.checkInAt)}` : ""} with
              no items recorded.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Recorded at the gate
                {visit.checkInAt ? ` from ${fmtTime(visit.checkInAt)}` : ""}
                {visit.gateLocation ? ` · ${visit.gateLocation}` : ""}. These must
                all leave with them.
              </p>
              <ul className="space-y-1.5">
                {visit.items.map((it, idx) => (
                  <li
                    key={`${it.name}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 wrap-break-word font-medium">{it.name}</span>
                    {it.addedAt && (
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {fmtTime(it.addedAt)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <Button onClick={onReset} className="mt-5 h-12 w-full rounded-lg" variant="outline">
        <RotateCcw className="mr-2 h-4 w-4" /> Scan another
      </Button>
    </div>
  );
}

function Field({
  icon: Icon, label, value, hint, mono, emphasis,
}: {
  icon: typeof User;
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd
        className={cn(
          "mt-1 wrap-break-word text-sm font-medium",
          mono && "font-mono",
          emphasis && "text-base font-bold text-[--color-brand-orange]",
        )}
      >
        {value || "—"}
      </dd>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
