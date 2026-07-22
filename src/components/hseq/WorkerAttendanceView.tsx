"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Loader2, Package, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { StatsCard } from "@/components/shared/StatsCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { WORKER_COMPANIES } from "@/types";

interface Movement {
  id: string;
  workerName: string;
  workerCode: string;
  company: string;
  direction: "IN" | "OUT";
  scannedAt: string | null;
  gateLocation: string;
  scannedByName: string;
}
interface OpenVisit {
  id: string;
  workerName: string;
  workerCode: string;
  company: string;
  items: string[];
  checkInAt: string | null;
}
interface Data {
  todayIn: number;
  todayOut: number;
  insideNow: number;
  movements: Movement[];
  openVisits: OpenVisit[];
}

/** Read-only worker attendance + item-record monitor (Nuwan & Dinesh). */
export function WorkerAttendanceView() {
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("ALL");
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (company !== "ALL") params.set("company", company);
    setLoading(true);
    fetch(`/api/hseq/worker-attendance?${params}`)
      .then((r) => r.json())
      .then((b) => setData(b))
      .catch(() => setData({ todayIn: 0, todayOut: 0, insideNow: 0, movements: [], openVisits: [] }))
      .finally(() => setLoading(false));
  }
  useEffect(load, [company]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ · Attendance"
          title="Worker Attendance"
          description="Yugadhanavi & Sobadhanavi gate movements and the items each worker currently has on record inside the site."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatsCard icon={Package} label="Inside Now (with items)" value={data?.insideNow ?? 0} accent="info" />
          <StatsCard icon={ArrowDownToLine} label="IN Today" value={data?.todayIn ?? 0} accent="success" />
          <StatsCard icon={ArrowUpFromLine} label="OUT Today" value={data?.todayOut ?? 0} accent="warning" />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Company</label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger className="h-10 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All companies</SelectItem>
                {WORKER_COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:flex-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") load(); }}
                placeholder="Worker name or ID…"
                className="h-10 pl-9"
              />
            </div>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </MotionWrapper>

      {/* Items currently on record (workers inside) */}
      <MotionWrapper delay={0.1}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
            <Package className="h-4 w-4 text-[--color-brand-ocean]" /> Items on record (inside now)
          </h3>
          {!data ? <Skeleton className="h-32 w-full" /> :
           data.openVisits.length === 0 ? (
             <EmptyState icon={Package} title="No open item records" description="No worker currently has items recorded inside the site." />
           ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.openVisits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="font-medium">{v.workerName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{v.workerCode}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-md">{v.company}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {v.checkInAt ? new Date(v.checkInAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </TableCell>
                    <TableCell>
                      {v.items.length === 0 ? <span className="text-muted-foreground">—</span> : (
                        <div className="flex flex-wrap gap-1.5">
                          {v.items.map((it, i) => (
                            <span key={`${it}-${i}`} className="rounded-md border border-border/60 bg-background/60 px-2 py-0.5 text-[11px]">{it}</span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           )}
        </div>
      </MotionWrapper>

      {/* Recent movements */}
      <MotionWrapper delay={0.12}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-base font-semibold">
            <Activity className="h-4 w-4 text-[--color-brand-ocean]" /> Recent gate movements
          </h3>
          {!data ? <Skeleton className="h-64 w-full" /> :
           data.movements.length === 0 ? (
             <EmptyState icon={Activity} title="No movements yet" />
           ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Gate</TableHead>
                    <TableHead>Officer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-xs">
                        {m.scannedAt ? new Date(m.scannedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{m.workerName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">{m.workerCode}</div>
                      </TableCell>
                      <TableCell>{m.company || "—"}</TableCell>
                      <TableCell>
                        <span className={
                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                          (m.direction === "IN"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-600")
                        }>{m.direction}</span>
                      </TableCell>
                      <TableCell className="text-xs">{m.gateLocation || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.scannedByName || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
           )}
        </div>
      </MotionWrapper>
    </div>
  );
}
