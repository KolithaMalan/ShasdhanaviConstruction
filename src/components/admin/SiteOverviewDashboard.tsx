"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, Building2, ChevronRight, HardHat,
  Loader2, RefreshCcw, Truck, UsersRound, BadgeCheck, Zap, Users,
} from "lucide-react";

import { StatsCard } from "@/components/shared/StatsCard";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Movement {
  id: string;
  name: string;
  identifier: string;
  entityType: string;
  company: string;
  direction: "IN" | "OUT";
  scannedAt: string | null;
  gateLocation: string;
}
interface ContractorRow {
  id: string;
  companyName: string;
  laborers: number;
  laborersInside: number;
  electricalTools: number;
  nonElectricalTools: number;
}
interface WorkerRow {
  id: string;
  name: string;
  workerId: string;
  company: string;
  department: string;
  designation: string;
  currentStatus: "IN" | "OUT";
  lastScanAt: string | null;
}
interface Overview {
  generatedAt: string;
  headCount: { total: number; laborers: number; permanent: number; workers: number };
  attendance: { todayIn: number; todayOut: number; scansToday: number; recent: Movement[] };
  vehiclesInside: number;
  electricalToolsOnSite: number;
  electricalToolItems: number;
  contractors: ContractorRow[];
  workerCompanies: { company: string; inside: number; total: number }[];
  workers: WorkerRow[];
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

/** Nuwan's primary monitoring dashboard — live site-wide overview. */
export function SiteOverviewDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dialogCompany, setDialogCompany] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/site-overview");
      if (!res.ok) return;
      setData(await res.json());
    } catch {
      /* ignore — keep last good data */
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, [load]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const dialogWorkers = dialogCompany
    ? data.workers.filter((w) => w.company === dialogCompany)
    : [];

  return (
    <div className="space-y-8">
      {/* ── Live head count ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
            People On Site · Live
          </p>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {refreshing && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Updated {new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            <Button size="sm" variant="ghost" onClick={load} className="h-7 rounded-md px-2">
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MotionWrapper delay={0.02}>
            <StatsCard icon={UsersRound} label="Total Head Count" value={data.headCount.total} accent="info"
                       hint="Everyone currently inside the site" />
          </MotionWrapper>
          <MotionWrapper delay={0.04}>
            <StatsCard icon={Users} label="Laborers" value={data.headCount.laborers} hint="Contractor employees inside" />
          </MotionWrapper>
          <MotionWrapper delay={0.06}>
            <StatsCard icon={BadgeCheck} label="Permanent Employees" value={data.headCount.permanent} hint="Permanent staff inside" />
          </MotionWrapper>
          <MotionWrapper delay={0.08}>
            <StatsCard icon={HardHat} label="Yuga / Soba Workers" value={data.headCount.workers} hint="Workers inside" />
          </MotionWrapper>
        </div>
      </div>

      {/* ── Attendance + assets ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MotionWrapper delay={0.1}>
          <StatsCard icon={ArrowDownToLine} label="Check-ins Today" value={data.attendance.todayIn} accent="success"
                     hint={`${data.attendance.scansToday} scans today`} />
        </MotionWrapper>
        <MotionWrapper delay={0.12}>
          <StatsCard icon={ArrowUpFromLine} label="Check-outs Today" value={data.attendance.todayOut} accent="warning" />
        </MotionWrapper>
        <MotionWrapper delay={0.14}>
          <StatsCard icon={Truck} label="Vehicles Inside" value={data.vehiclesInside} />
        </MotionWrapper>
        <MotionWrapper delay={0.16}>
          <StatsCard icon={Zap} label="Electrical Tools On Site" value={data.electricalToolsOnSite}
                     hint={`${data.electricalToolItems} item type(s)`} />
        </MotionWrapper>
      </div>

      {/* ── Yugadhanavi / Sobadhanavi ── */}
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
          Yugadhanavi &amp; Sobadhanavi · Click for details
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.workerCompanies.map((c, i) => (
            <MotionWrapper key={c.company} delay={0.18 + i * 0.03}>
              <button
                type="button"
                onClick={() => setDialogCompany(c.company)}
                className="group w-full rounded-xl border border-border/60 bg-card/60 p-5 text-left backdrop-blur-md transition-all hover:border-[--color-brand-ocean]/50 hover:bg-card/80 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
                      <HardHat className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-heading text-base font-semibold">{c.company}</p>
                      <p className="text-[11px] text-muted-foreground">{c.total} registered</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-mono text-3xl font-bold text-foreground">{c.inside}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">on site</div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </button>
            </MotionWrapper>
          ))}
        </div>
      </div>

      {/* ── Contractor summary ── */}
      <MotionWrapper delay={0.24}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
            <Building2 className="h-4 w-4 text-[--color-brand-ocean]" /> Contractor Summary
          </h3>
          {data.contractors.length === 0 ? (
            <EmptyState icon={Building2} title="No active contractors" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contractor</TableHead>
                    <TableHead className="text-right">Laborers</TableHead>
                    <TableHead className="text-right">On Site</TableHead>
                    <TableHead className="text-right">Electrical Tools</TableHead>
                    <TableHead className="text-right">Non-Electrical Tools</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.contractors.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.companyName}</TableCell>
                      <TableCell className="text-right font-mono">{c.laborers}</TableCell>
                      <TableCell className="text-right">
                        <span className={
                          "inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium " +
                          (c.laborersInside > 0
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-border/60 bg-muted/40 text-muted-foreground")
                        }>{c.laborersInside}</span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{c.electricalTools}</TableCell>
                      <TableCell className="text-right font-mono">{c.nonElectricalTools}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </MotionWrapper>

      {/* ── Live IN/OUT log ── */}
      <MotionWrapper delay={0.28}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
            <Activity className="h-4 w-4 text-[--color-brand-ocean]" /> Live Check-in / Check-out Log
          </h3>
          {data.attendance.recent.length === 0 ? (
            <EmptyState icon={Activity} title="No gate movements yet today" />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Gate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.attendance.recent.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">{fmtTime(m.scannedAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{m.name}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{m.identifier}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-md font-mono text-[10px]">{m.entityType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{m.company || "—"}</TableCell>
                      <TableCell>
                        <span className={
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (m.direction === "IN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600")
                        }>{m.direction}</span>
                      </TableCell>
                      <TableCell className="text-xs">{m.gateLocation || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </MotionWrapper>

      {/* ── Worker detail dialog ── */}
      <Dialog open={!!dialogCompany} onOpenChange={(o) => { if (!o) setDialogCompany(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5 text-[--color-brand-ocean]" /> {dialogCompany} Workers
            </DialogTitle>
            <DialogDescription>
              {dialogWorkers.filter((w) => w.currentStatus === "IN").length} of {dialogWorkers.length} currently on site.
            </DialogDescription>
          </DialogHeader>

          {dialogWorkers.length === 0 ? (
            <EmptyState icon={HardHat} title="No workers registered" />
          ) : (
            <ScrollArea className="max-h-[60vh] pr-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Worker ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialogWorkers.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-[11px] text-muted-foreground">{w.designation || "—"}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{w.workerId}</TableCell>
                      <TableCell>{w.department || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {w.currentStatus === "IN" ? fmtTime(w.lastScanAt) : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={
                          "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (w.currentStatus === "IN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-border/60 bg-muted/40 text-muted-foreground")
                        }>{w.currentStatus === "IN" ? "On site" : "Off site"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
