"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Row {
  id: string;
  companyName: string;
  toolType: "ELECTRICAL" | "NON_ELECTRICAL";
  toolName: string;
  toolIdentifier: string;
  direction: "IN" | "OUT";
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  gatePassId: string;
  processedAt: string;
  processedByName: string;
  notes: string;
}

export default function InternalSecurityMovementsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [direction, setDirection] = useState("ALL");
  const [toolType, setToolType] = useState("ALL");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    if (direction !== "ALL") params.set("direction", direction);
    if (toolType !== "ALL") params.set("toolType", toolType);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/internal-security/movements?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Internal Security"
          title="Movement History"
          description="Every tool IN/OUT processed via gate pass — fully auditable."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <DateField id="from" label="From" value={from} onChange={setFrom} />
          <DateField id="to" label="To" value={to} onChange={setTo} />
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="h-10 w-32"><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any direction</SelectItem>
              <SelectItem value="IN">IN</SelectItem>
              <SelectItem value="OUT">OUT</SelectItem>
            </SelectContent>
          </Select>
          <Select value={toolType} onValueChange={setToolType}>
            <SelectTrigger className="h-10 w-40"><SelectValue placeholder="Tool type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any tool type</SelectItem>
              <SelectItem value="ELECTRICAL">Electrical</SelectItem>
              <SelectItem value="NON_ELECTRICAL">Non-Electrical</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Tool, gate pass, ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={load} className="h-10 rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            Apply
          </Button>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={History} title="No movements" /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead><TableHead>Direction</TableHead>
                  <TableHead>Contractor</TableHead><TableHead>Tool</TableHead>
                  <TableHead>Qty</TableHead><TableHead>Bal. Before</TableHead>
                  <TableHead>Bal. After</TableHead><TableHead>Gate Pass</TableHead>
                  <TableHead>Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.processedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                    <TableCell>
                      <span className={
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (r.direction === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/30 bg-red-500/10 text-red-600")
                      }>{r.direction}</span>
                    </TableCell>
                    <TableCell>{r.companyName}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.toolName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.toolIdentifier}</div>
                    </TableCell>
                    <TableCell className="font-mono">{r.quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.balanceBefore}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{r.balanceAfter}</TableCell>
                    <TableCell className="font-mono text-xs">{r.gatePassId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.processedByName}</TableCell>
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
