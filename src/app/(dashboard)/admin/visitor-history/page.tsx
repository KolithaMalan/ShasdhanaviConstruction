"use client";

import { useEffect, useState } from "react";
import { History, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Row {
  id: string;
  visitorPassId: string;
  name: string;
  nicNumber: string;
  company: string;
  purpose: string;
  contactPerson: string;
  currentStatus: "IN" | "OUT" | "COMPLETED";
  enteredAt: string;
  exitedAt: string | null;
  durationMs: number | null;
}

type StatusTab = "ALL" | "IN" | "COMPLETED";

export default function AdminVisitorHistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [passId, setPassId] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<StatusTab>("ALL");
  const [items, setItems] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    if (passId.trim()) params.set("passId", passId.trim());
    if (company.trim()) params.set("company", company.trim());
    if (status !== "ALL") params.set("status", status);
    setLoading(true);
    fetch(`/api/admin/visitor-history?${params}`)
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
          eyebrow="Admin"
          title="Visitor History"
          description="All visitor entries and exits — searchable, filterable, exportable."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <DateField id="from" label="From" value={from} onChange={setFrom} />
          <DateField id="to" label="To" value={to} onChange={setTo} />
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Pass ID</label>
            <Input value={passId} onChange={(e) => setPassId(e.target.value)} placeholder="VP-001" className="h-10 w-32 font-mono uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme…" className="h-10 w-48" />
          </div>
          <Tabs value={status} onValueChange={(v) => setStatus(v as StatusTab)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="IN">Inside</TabsTrigger>
              <TabsTrigger value="COMPLETED">Exited</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={load} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            <Search className="mr-2 h-4 w-4" /> Apply
          </Button>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={History} title="No visitor history" description="Try widening the date range." /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Pass</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead>Exited</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.enteredAt).toLocaleDateString("en-GB")}</TableCell>
                    <TableCell className="font-mono text-xs">{r.visitorPassId}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                    <TableCell>{r.company || "—"}</TableCell>
                    <TableCell className="max-w-50 truncate">{r.purpose || "—"}</TableCell>
                    <TableCell>{r.contactPerson || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{new Date(r.enteredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                    <TableCell className="font-mono text-xs">{r.exitedAt ? new Date(r.exitedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDuration(r.durationMs)}</TableCell>
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

function formatDuration(ms: number | null): string {
  if (!ms || ms < 0) return "—";
  const totalMin = Math.round(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
