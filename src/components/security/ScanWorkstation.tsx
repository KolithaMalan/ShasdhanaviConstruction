"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle, Camera, Keyboard, Loader2, RotateCcw, ScanLine, Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import type { SerializedEmployee } from "@/lib/employee";
import type { SerializedVehicle } from "@/lib/vehicle";
import type { MaterialsItem } from "@/lib/materialsPass";
import { EmployeeResultPanel } from "@/components/security/EmployeeResultPanel";
import { VehicleResultPanel } from "@/components/security/VehicleResultPanel";
import { VisitorPanel } from "@/components/security/VisitorPanel";
import { MaterialsPanel } from "@/components/security/MaterialsPanel";
import { PermanentEmployeePanel } from "@/components/security/PermanentEmployeePanel";
import { WorkerPanel } from "@/components/security/WorkerPanel";

const WebcamQrScanner = dynamic(
  () => import("@/components/security/WebcamQrScanner"),
  { ssr: false, loading: () => <Skeleton className="aspect-square w-full max-w-md rounded-2xl" /> },
);

type ScanMode = "QR_SCANNER" | "WEBCAM" | "MANUAL";

type ScanResult =
  | { kind: "EMPLOYEE"; employee: SerializedEmployee }
  | { kind: "VEHICLE"; vehicle: SerializedVehicle }
  | {
      kind: "VISITOR_PASS";
      pass: { id: string; passId: string; currentStatus: "AVAILABLE" | "IN_USE" };
      visitor: null | {
        id: string; name: string; nicNumber: string;
        company: string; purpose: string; contactPerson: string; enteredAt: string;
      };
    }
  | { kind: "MATERIALS"; contractor: { id: string; companyName: string }; items: MaterialsItem[] }
  | {
      kind: "PERMANENT_EMPLOYEE";
      permanent: {
        id: string; name: string; designation: string;
        department: string; nicNumber: string; permanentId: string; photoUrl: string;
        currentStatus: "IN" | "OUT";
      };
    }
  | {
      kind: "WORKER";
      worker: {
        id: string; name: string; company: string; designation: string;
        nicNumber: string; workerId: string; photoUrl: string;
        currentStatus: "IN" | "OUT";
      };
      openVisit: null | { id: string; items: { name: string }[]; checkInAt: string | null };
    }
  | { kind: "ERROR"; code: string; message: string };

interface Stats {
  scansToday: number;
  inToday: number;
  outToday: number;
  insideTotals: { all: number; employees: number; vehicles: number; visitors: number };
}

export function ScanWorkstation() {
  const [mode, setMode] = useState<ScanMode>("QR_SCANNER");
  const [gate, setGate] = useState<string>("Main Gate");
  const [scanInput, setScanInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, startScan] = useTransition();
  const [marking, startMark] = useTransition();
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  const scannerRef = useRef<HTMLInputElement | null>(null);
  const manualRef = useRef<HTMLInputElement | null>(null);

  /* ── Autofocus the hidden scanner input in QR_SCANNER mode ── */
  useEffect(() => {
    if (mode !== "QR_SCANNER") return;
    const id = window.setInterval(() => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active === scannerRef.current || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        return;
      }
      scannerRef.current?.focus();
    }, 600);
    scannerRef.current?.focus();
    return () => window.clearInterval(id);
  }, [mode, result]);

  /* ── Today stats — polled every 30s ── */
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/security/stats");
        const body = await res.json();
        if (!cancelled) setStats(body);
      } catch { /* ignore */ }
    };
    load();
    const t = window.setInterval(load, 30_000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      const isTyping = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "Escape") {
        resetForNextScan();
        return;
      }
      if (isTyping) return;
      if (result?.kind === "EMPLOYEE") {
        if (e.key === " ") { e.preventDefault(); markEmployee("IN"); }
        if (e.key === "Backspace") { e.preventDefault(); markEmployee("OUT"); }
      } else if (result?.kind === "VEHICLE") {
        if (e.key === " ") { e.preventDefault(); markVehicle("IN"); }
        if (e.key === "Backspace") { e.preventDefault(); markVehicle("OUT"); }
      } else if (result?.kind === "PERMANENT_EMPLOYEE") {
        if (e.key === " ") { e.preventDefault(); markPermanent("IN"); }
        if (e.key === "Backspace") { e.preventDefault(); markPermanent("OUT"); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const resetForNextScan = useCallback(() => {
    setResult(null);
    setScanInput("");
    setTimeout(() => {
      if (mode === "QR_SCANNER") scannerRef.current?.focus();
      else if (mode === "MANUAL") manualRef.current?.focus();
    }, 40);
  }, [mode]);

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/security/stats");
      setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const handleScan = useCallback(
    (raw: string, scanMethod: "QR_SCANNER" | "WEBCAM" | "MANUAL") => {
      const text = raw.trim();
      if (!text) return;
      startScan(async () => {
        try {
          const res = await fetch("/api/security/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qrData: text, scanMethod }),
          });
          const body = (await res.json()) as ScanResult;
          if (body.kind === "ERROR") {
            setShake((n) => n + 1);
            beep("error");
          } else {
            beep("ok");
          }
          setResult(body);
        } catch {
          setShake((n) => n + 1);
          beep("error");
          setResult({ kind: "ERROR", code: "NETWORK", message: "Network error — try again." });
        } finally {
          setScanInput("");
        }
      });
    },
    [],
  );

  function onScannerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScan(scanInput, "QR_SCANNER");
    }
  }

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleScan(scanInput, "MANUAL");
  }

  function markEmployee(direction: "IN" | "OUT") {
    if (result?.kind !== "EMPLOYEE") return;
    const emp = result.employee;
    if (emp.currentStatus === direction) return;
    startMark(async () => {
      // Optimistic UI
      setResult({
        kind: "EMPLOYEE",
        employee: { ...emp, currentStatus: direction, lastScanAt: new Date().toISOString() },
      });
      try {
        const res = await fetch("/api/security/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "EMPLOYEE",
            entityId: emp.id,
            direction,
            gateLocation: gate,
            scanMethod: mode,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Mark failed");
        beep("mark");
        setLastEvent(`${emp.name} · ${direction} · ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
        toast.success(`${direction === "IN" ? "IN" : "OUT"} marked`, { description: emp.name });
        refreshStats();
        setTimeout(resetForNextScan, 900);
      } catch (e) {
        // Rollback
        setResult({ kind: "EMPLOYEE", employee: emp });
        beep("error");
        toast.error(e instanceof Error ? e.message : "Mark failed");
      }
    });
  }

  function markVehicle(direction: "IN" | "OUT") {
    if (result?.kind !== "VEHICLE") return;
    const veh = result.vehicle;
    if (veh.currentStatus === direction) return;
    startMark(async () => {
      setResult({ kind: "VEHICLE", vehicle: { ...veh, currentStatus: direction, lastScanAt: new Date().toISOString() } });
      try {
        const res = await fetch("/api/security/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "VEHICLE",
            entityId: veh.id,
            direction,
            gateLocation: gate,
            scanMethod: mode,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Mark failed");
        beep("mark");
        setLastEvent(`${veh.vehicleNumber} · ${direction} · ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
        toast.success(`Vehicle ${direction}`, { description: veh.vehicleNumber });
        refreshStats();
        setTimeout(resetForNextScan, 900);
      } catch (e) {
        setResult({ kind: "VEHICLE", vehicle: veh });
        beep("error");
        toast.error(e instanceof Error ? e.message : "Mark failed");
      }
    });
  }

  function markPermanent(direction: "IN" | "OUT") {
    if (result?.kind !== "PERMANENT_EMPLOYEE") return;
    const perm = result.permanent;
    if (perm.currentStatus === direction) return;
    startMark(async () => {
      setResult({ kind: "PERMANENT_EMPLOYEE", permanent: { ...perm, currentStatus: direction } });
      try {
        const res = await fetch("/api/security/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: "PERMANENT",
            entityId: perm.id,
            direction,
            gateLocation: gate,
            scanMethod: mode,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Mark failed");
        beep("mark");
        setLastEvent(`${perm.name} · ${direction} · ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
        toast.success(`Permanent ${direction}`, { description: perm.name });
        refreshStats();
        setTimeout(resetForNextScan, 900);
      } catch (e) {
        setResult({ kind: "PERMANENT_EMPLOYEE", permanent: perm });
        beep("error");
        toast.error(e instanceof Error ? e.message : "Mark failed");
      }
    });
  }

  const headline = useMemo(() => {
    if (mode === "QR_SCANNER") return "Waiting for scan…";
    if (mode === "WEBCAM") return "Point the camera at a QR code";
    return "Enter Employee ID or NIC";
  }, [mode]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
      {/* LEFT — Scan zone */}
      <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md sm:p-6">
        <ModeSwitcher mode={mode} onChange={(m) => { setMode(m); setResult(null); }} />

        <div className="mt-5 space-y-4">
          {mode === "QR_SCANNER" && (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/70 bg-background/40 p-8 text-center">
              <ScanLine className="mx-auto h-14 w-14 animate-pulse text-[--color-brand-sky]" />
              <p className="mt-4 font-heading text-xl font-semibold">{headline}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Point your handheld scanner at any QR code on site.
              </p>
              {/* Hidden capture input — scanner emits keystrokes + Enter */}
              <input
                ref={scannerRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={onScannerKeyDown}
                aria-label="Hidden scanner input"
                className="sr-only"
                autoFocus
              />
              {scanning && (
                <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> processing…
                </div>
              )}
            </div>
          )}

          {mode === "WEBCAM" && (
            <WebcamQrScanner
              paused={!!result}
              onResult={(text) => handleScan(text, "WEBCAM")}
            />
          )}

          {mode === "MANUAL" && (
            <form onSubmit={onManualSubmit} className="space-y-3">
              <Label htmlFor="manual" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Employee ID, NIC, Visitor Pass, or Vehicle ID
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="manual"
                  ref={manualRef}
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Enter Employee ID (SHA-YYYY-XXXXX) or NIC number"
                  className="h-12 pl-9 font-mono text-base uppercase"
                  autoFocus
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Examples: SHA-2026-A1B2C · 952341234V · 199523401234 · VP-001 · VEH-2026-XYZAB
              </p>
              <Button type="submit" disabled={scanning || !scanInput.trim()}
                      className="h-11 w-full rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                {scanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Look up
              </Button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gate</Label>
            <Select value={gate} onValueChange={setGate}>
              <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Main Gate", "North Gate", "Contractor Gate", "Emergency Gate"].map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {lastEvent && (
            <div className="text-right text-[11px] font-mono text-muted-foreground">
              Last:<br /> <span className="text-foreground">{lastEvent}</span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Result panel */}
      <div className="min-h-[480px]">
        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md"
            >
              <Skeleton className="h-44 w-full" />
              <Skeleton className="mt-4 h-9 w-1/2" />
              <Skeleton className="mt-2 h-5 w-2/3" />
              <div className="mt-8 grid grid-cols-2 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </motion.div>
          ) : !result ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center backdrop-blur-md"
            >
              <ScanLine className="h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 font-heading text-2xl font-semibold">Ready to scan</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Scan a worker ID, vehicle pass, or visitor pass to begin.
              </p>
              {lastEvent && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Last scan: <span className="font-mono text-foreground">{lastEvent}</span>
                </p>
              )}
            </motion.div>
          ) : result.kind === "EMPLOYEE" ? (
            <motion.div key={`emp-${result.employee.id}`} animate={shakeFx(shake)} initial={{ opacity: 0, y: 8 }} exit={{ opacity: 0 }}>
              <EmployeeResultPanel employee={result.employee} pending={marking} onMark={markEmployee} />
            </motion.div>
          ) : result.kind === "VEHICLE" ? (
            <motion.div key={`veh-${result.vehicle.id}`} animate={shakeFx(shake)} initial={{ opacity: 0, y: 8 }} exit={{ opacity: 0 }}>
              <VehicleResultPanel vehicle={result.vehicle} pending={marking} onMark={markVehicle} />
            </motion.div>
          ) : result.kind === "VISITOR_PASS" ? (
            <motion.div key={`vp-${result.pass.passId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <VisitorPanel
                passId={result.pass.passId}
                currentVisitor={result.visitor}
                onCompleted={() => { refreshStats(); resetForNextScan(); }}
              />
            </motion.div>
          ) : result.kind === "MATERIALS" ? (
            <motion.div key={`mat-${result.contractor.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <MaterialsPanel
                companyName={result.contractor.companyName}
                items={result.items}
                onReset={resetForNextScan}
              />
            </motion.div>
          ) : result.kind === "PERMANENT_EMPLOYEE" ? (
            <motion.div key={`perm-${result.permanent.id}`} animate={shakeFx(shake)} initial={{ opacity: 0, y: 8 }} exit={{ opacity: 0 }}>
              <PermanentEmployeePanel permanent={result.permanent} pending={marking} onMark={markPermanent} onReset={resetForNextScan} />
            </motion.div>
          ) : result.kind === "WORKER" ? (
            <motion.div key={`wrk-${result.worker.id}`} animate={shakeFx(shake)} initial={{ opacity: 0, y: 8 }} exit={{ opacity: 0 }}>
              <WorkerPanel
                worker={result.worker}
                openVisit={result.openVisit}
                gate={gate}
                scanMethod={mode}
                onCompleted={() => { refreshStats(); resetForNextScan(); }}
                onReset={resetForNextScan}
              />
            </motion.div>
          ) : (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }} animate={shakeFx(shake)} exit={{ opacity: 0 }}
              className="rounded-2xl border-l-4 border-red-500 border-border/60 bg-red-500/5 p-8"
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="mt-1 h-9 w-9 text-red-500" />
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-red-500">{result.code}</p>
                  <h2 className="mt-1 font-heading text-2xl font-bold">Entry denied</h2>
                  <p className="mt-2 text-base text-foreground">{result.message}</p>
                </div>
              </div>
              <Button onClick={resetForNextScan}
                      className="mt-6 h-12 rounded-lg bg-[--color-brand-ocean] px-6 text-white hover:bg-[--color-brand-ocean]/90">
                <RotateCcw className="mr-2 h-4 w-4" /> Dismiss & Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer stats strip */}
        {stats && (
          <div className="mt-4 grid grid-cols-4 gap-3 rounded-xl border border-border/60 bg-card/40 p-3 backdrop-blur-md">
            <Stat label="Inside Site" value={stats.insideTotals.all} />
            <Stat label="Scans Today" value={stats.scansToday} />
            <Stat label="IN today" value={stats.inToday} tone="ok" />
            <Stat label="OUT today" value={stats.outToday} tone="warn" />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeSwitcher({ mode, onChange }: { mode: ScanMode; onChange: (m: ScanMode) => void }) {
  const buttons: { id: ScanMode; label: string; icon: typeof ScanLine }[] = [
    { id: "QR_SCANNER", label: "Handheld", icon: ScanLine },
    { id: "WEBCAM", label: "Webcam", icon: Camera },
    { id: "MANUAL", label: "Manual", icon: Keyboard },
  ];
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-background/60 p-1 ring-1 ring-border/60">
      {buttons.map((b) => {
        const active = mode === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(b.id)}
            className={
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all " +
              (active
                ? "bg-[--color-brand-ocean] text-white shadow"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground")
            }
          >
            <b.icon className="h-3.5 w-3.5" />
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  const color = tone === "ok" ? "text-emerald-500" : tone === "warn" ? "text-amber-500" : "text-foreground";
  return (
    <div className="text-center">
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function shakeFx(seed: number) {
  if (seed === 0) return { x: 0, opacity: 1, y: 0 };
  return { x: [0, -8, 8, -6, 6, 0], opacity: 1, y: 0, transition: { duration: 0.35 } };
}

/* Tiny Web-Audio bleep — no audio assets needed */
function beep(kind: "ok" | "error" | "mark") {
  try {
    const AudioCtor =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine";
    if (kind === "ok") o.frequency.value = 880;
    if (kind === "mark") o.frequency.value = 1320;
    if (kind === "error") o.frequency.value = 220;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (kind === "error" ? 0.25 : 0.14));
    o.start();
    o.stop(ctx.currentTime + (kind === "error" ? 0.28 : 0.16));
    o.onended = () => ctx.close();
  } catch { /* ignore */ }
}
