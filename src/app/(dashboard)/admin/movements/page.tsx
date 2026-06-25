"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  ArrowRightToLine,
  ArrowLeftToLine,
  Download,
  HardHat,
  Loader2,
  Search,
  Truck,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type EntityType = "EMPLOYEE" | "VEHICLE" | "VISITOR";
type Direction = "IN" | "OUT";

interface Row {
  id: string;
  entityType: EntityType;
  entityName: string;
  entityIdentifier: string;
  companyName: string;
  direction: Direction;
  scannedAt: string;
  gateLocation: string;
  scannedByName: string;
  scanMethod: string;
  notes: string;
}

type TypeTab = "ALL" | EntityType;
type DirTab = "ALL" | Direction;

const ENTITY_META: Record<EntityType, { label: string; icon: typeof HardHat }> = {
  EMPLOYEE: { label: "Employee", icon: HardHat },
  VEHICLE: { label: "Vehicle", icon: Truck },
  VISITOR: { label: "Visitor", icon: UserRound },
};

export default function AdminMovementsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");
  const [contractor, setContractor] = useState("");
  const [type, setType] = useState<TypeTab>("ALL");
  const [direction, setDirection] = useState<DirTab>("ALL");
  const [items, setItems] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  function buildParams() {
    const params = new URLSearchParams();
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    if (q.trim()) params.set("q", q.trim());
    if (contractor.trim()) params.set("contractor", contractor.trim());
    if (type !== "ALL") params.set("entityType", type);
    if (direction !== "ALL") params.set("direction", direction);
    return params;
  }

  function load() {
    setLoading(true);
    fetch(`/api/admin/movements?${buildParams()}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function exportPdf() {
    setExporting(true);
    try {
      const params = buildParams();
      params.set("format", "pdf");
      const res = await fetch(`/api/reports/movement-log?${params}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gate-movements.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("Movement log downloaded");
    } catch {
      toast.error("Download failed");
    } finally {
      setExporting(false);
    }
  }

  const inCount = items?.filter((r) => r.direction === "IN").length ?? 0;
  const outCount = items?.filter((r) => r.direction === "OUT").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin · HSEQ"
          title="Gate Movements"
          description="Complete IN / OUT history for all employees, vehicles and visitors at the gate."
          actions={
            <Button
              onClick={exportPdf}
              disabled={exporting || !items?.length}
              variant="outline"
              className="rounded-lg"
            >
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export PDF
            </Button>
          }
        />
      </MotionWrapper>

      {/* Summary chips */}
      <MotionWrapper delay={0.03}>
        <div className="grid grid-cols-3 gap-3 sm:max-w-md">
          <StatChip label="Movements" value={items?.length ?? 0} icon={ArrowLeftRight} tone="ocean" />
          <StatChip label="Entries" value={inCount} icon={ArrowRightToLine} tone="green" />
          <StatChip label="Exits" value={outCount} icon={ArrowLeftToLine} tone="amber" />
        </div>
      </MotionWrapper>

      {/* Filters */}
      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <DateField id="from" label="From" value={from} onChange={setFrom} />
          <DateField id="to" label="To" value={to} onChange={setTo} />
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ID…" className="h-10 w-44" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Contractor</label>
            <Input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="Company…" className="h-10 w-44" />
          </div>
          <Tabs value={type} onValueChange={(v) => setType(v as TypeTab)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="EMPLOYEE">Employees</TabsTrigger>
              <TabsTrigger value="VEHICLE">Vehicles</TabsTrigger>
              <TabsTrigger value="VISITOR">Visitors</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={direction} onValueChange={(v) => setDirection(v as DirTab)}>
            <TabsList>
              <TabsTrigger value="ALL">In + Out</TabsTrigger>
              <TabsTrigger value="IN">In</TabsTrigger>
              <TabsTrigger value="OUT">Out</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={load} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            <Search className="mr-2 h-4 w-4" /> Apply
          </Button>
        </div>
      </MotionWrapper>

      {/* Table */}
      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={ArrowLeftRight} title="No movements found" description="Try widening the date range or clearing filters." />
         ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => {
                  const meta = ENTITY_META[r.entityType];
                  const Icon = meta.icon;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.scannedAt).toLocaleDateString("en-GB")}</TableCell>
                      <TableCell className="font-mono text-xs">{new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.direction === "IN" ? "default" : "secondary"} className={r.direction === "IN" ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15" : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"}>
                          {r.direction === "IN" ? "IN" : "OUT"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{r.entityName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.entityIdentifier}</TableCell>
                      <TableCell>{r.companyName || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.gateLocation}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.scannedByName || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
         )}
      </MotionWrapper>
    </div>
  );
}

function DateField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}

function StatChip({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof HardHat; tone: "ocean" | "green" | "amber" }) {
  const tones = {
    ocean: "text-[--color-brand-ocean] bg-[--color-brand-ocean]/10",
    green: "text-emerald-600 bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-500/10",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 backdrop-blur-md">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-mono text-lg font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
