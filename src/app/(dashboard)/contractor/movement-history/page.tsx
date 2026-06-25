"use client";

import { useEffect, useState, useTransition } from "react";
import { Activity, Calendar, FileDown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface EmployeeRow {
  id: string;
  employeeName: string;
  nicNumber: string;
  direction: "IN" | "OUT";
  scannedAt: string;
  gateLocation: string;
  officerName: string;
}
interface VehicleRow {
  id: string;
  vehicleNumber: string;
  direction: "IN" | "OUT";
  scannedAt: string;
  gateLocation: string;
  officerName: string;
}

export default function ContractorMovementHistoryPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [q, setQ] = useState("");

  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [vehicles, setVehicles] = useState<VehicleRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, startPdf] = useTransition();

  function load() {
    const params = new URLSearchParams();
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    Promise.all([
      fetch(`/api/contractor/movements/employees?${params}`).then((r) => r.json()),
      fetch(`/api/contractor/movements/vehicles?${params}`).then((r) => r.json()),
    ])
      .then(([e, v]) => {
        setEmployees(e.items ?? []);
        setVehicles(v.items ?? []);
      })
      .catch(() => { setEmployees([]); setVehicles([]); })
      .finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  function downloadWorkingDaysPdf() {
    startPdf(async () => {
      try {
        const params = new URLSearchParams();
        if (from) params.set("startDate", from);
        if (to) params.set("endDate", to);
        const res = await fetch(`/api/contractor/reports/working-days?${params}`);
        if (!res.ok) throw new Error("Download failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `working-days-${from}-to-${to}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success("Working-days PDF downloaded");
      } catch {
        toast.error("Failed to download PDF");
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title="Movement History"
          description="Live gate IN/OUT history for your workforce and vehicles, sourced from real security scans."
          actions={
            <Button
              variant="outline"
              onClick={downloadWorkingDaysPdf}
              disabled={downloadingPdf}
              className="rounded-lg"
            >
              {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
              Working-Days PDF
            </Button>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <DateField id="from" label="From" value={from} onChange={setFrom} />
          <DateField id="to" label="To" value={to} onChange={setTo} />
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-9" placeholder="Name or NIC…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Apply
          </Button>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        <Tabs defaultValue="employees">
          <TabsList>
            <TabsTrigger value="employees">Employee Movements</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicle Movements</TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="mt-4">
            {employees === null ? (
              <Skeleton className="h-64 w-full" />
            ) : employees.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No employee movements"
                description="Once your workforce is scanned at the gate, IN/OUT events will appear here."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>NIC</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Officer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.scannedAt).toLocaleDateString("en-GB")}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                        <TableCell><DirectionBadge dir={r.direction} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.gateLocation}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.officerName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="mt-4">
            {vehicles === null ? (
              <Skeleton className="h-64 w-full" />
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No vehicle movements"
                description="Vehicle gate logs will appear here as soon as your vehicles are scanned at the gate."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Officer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{new Date(r.scannedAt).toLocaleDateString("en-GB")}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(r.scannedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</TableCell>
                        <TableCell className="font-medium">{r.vehicleNumber}</TableCell>
                        <TableCell><DirectionBadge dir={r.direction} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.gateLocation}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.officerName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  );
}

function DateField({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}

function DirectionBadge({ dir }: { dir: "IN" | "OUT" }) {
  const cls = dir === "IN"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
    : "border-slate-500/30 bg-slate-500/10 text-slate-500";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {dir}
    </span>
  );
}
