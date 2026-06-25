"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight, ArrowRightToLine, ArrowLeftToLine, BadgeCheck, Loader2, Search,
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

interface Row {
  id: string;
  name: string;
  identifier: string;
  direction: "IN" | "OUT";
  scannedAt: string;
  gateLocation: string;
  scannedByName: string;
}

type DirTab = "ALL" | "IN" | "OUT";

export default function PermanentMovementsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");
  const [direction, setDirection] = useState<DirTab>("ALL");
  const [items, setItems] = useState<Row[] | null>(null);
  const [insideNow, setInsideNow] = useState(0);
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    if (q.trim()) params.set("q", q.trim());
    if (direction !== "ALL") params.set("direction", direction);
    setLoading(true);
    fetch(`/api/permanent-movements?${params}`)
      .then((r) => r.json())
      .then((b) => { setItems(b.items ?? []); setInsideNow(b.insideNow ?? 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inCount = items?.filter((r) => r.direction === "IN").length ?? 0;
  const outCount = items?.filter((r) => r.direction === "OUT").length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Gate"
          title="Permanent Employee Movements"
          description="IN / OUT history at the gate for permanent staff passes."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.03}>
        <div className="grid grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
          <StatChip label="Inside now" value={insideNow} icon={BadgeCheck} tone="emerald" />
          <StatChip label="Movements" value={items?.length ?? 0} icon={ArrowLeftRight} tone="ocean" />
          <StatChip label="Entries" value={inCount} icon={ArrowRightToLine} tone="emerald" />
          <StatChip label="Exits" value={outCount} icon={ArrowLeftToLine} tone="amber" />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <DateField id="from" label="From" value={from} onChange={setFrom} />
          <DateField id="to" label="To" value={to} onChange={setTo} />
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or ID…" className="h-10 w-44" />
          </div>
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
                  <TableHead>Direction</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Permanent ID</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.scannedAt).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="font-mono text-xs">{new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell>
                      <Badge className={r.direction === "IN"
                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15"
                        : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/15"}>
                        {r.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.identifier}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.gateLocation}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.scannedByName || "—"}</TableCell>
                  </TableRow>
                ))}
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

function StatChip({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof BadgeCheck; tone: "ocean" | "emerald" | "amber" }) {
  const tones = {
    ocean: "text-[--color-brand-ocean] bg-[--color-brand-ocean]/10",
    emerald: "text-emerald-600 bg-emerald-500/10",
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
