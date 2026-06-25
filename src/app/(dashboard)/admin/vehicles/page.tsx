"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Loader2, Search, Truck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SerializedVehicle } from "@/lib/vehicle";

export default function AdminVehiclesPage() {
  const [items, setItems] = useState<SerializedVehicle[] | null>(null);
  const [q, setQ] = useState("");
  const [contractor, setContractor] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (contractor !== "ALL") params.set("contractor", contractor);
    setLoading(true);
    fetch(`/api/admin/vehicles?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, contractor]);

  const contractors = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((v) => v.companyName))).sort();
  }, [items]);

  async function downloadQr(v: SerializedVehicle) {
    try {
      const res = await fetch(`/api/admin/vehicles/${v.id}/qr`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `vehicle-${v.vehicleNumber.replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success("QR downloaded");
    } catch { toast.error("Download failed"); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin"
          title="Vehicles"
          description="All vehicles registered across contractors. Click a row for QR pass and gate movements."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Vehicle #, QR id, contractor…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={contractor} onValueChange={setContractor}>
            <SelectTrigger className="h-9 w-64"><SelectValue placeholder="All contractors" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All contractors</SelectItem>
              {contractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={Truck} title="No vehicles" description="Approved contractor vehicles will appear here automatically." /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>QR ID</TableHead>
                  <TableHead>Currently</TableHead>
                  <TableHead className="text-right">QR</TableHead>
                  <TableHead aria-label="open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((v) => (
                  <TableRow key={v.id} className="group">
                    <TableCell className="font-medium">{v.vehicleNumber}</TableCell>
                    <TableCell>{v.vehicleType}</TableCell>
                    <TableCell>{v.vehicleColour || "—"}</TableCell>
                    <TableCell>{v.companyName}</TableCell>
                    <TableCell className="font-mono text-xs">{v.vehicleQrId}</TableCell>
                    <TableCell>
                      <span className={
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (v.currentStatus === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-500")
                      }>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {v.currentStatus === "IN" ? "Inside" : "Outside"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => downloadQr(v)} className="rounded-lg">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> PNG
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/vehicles/${v.id}`}
                            className="inline-flex items-center text-sm font-medium text-[--color-brand-ocean] transition-transform group-hover:translate-x-0.5">
                        Open <ChevronRight className="ml-0.5 h-4 w-4" />
                      </Link>
                    </TableCell>
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
