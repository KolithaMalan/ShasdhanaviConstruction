"use client";

import { useEffect, useState } from "react";
import { Truck, Plus, Download } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdditionalRequestDialog } from "@/components/contractor/AdditionalRequestDialog";
import type { SerializedVehicle } from "@/lib/vehicle";

export default function ContractorVehiclesPage() {
  const [items, setItems] = useState<SerializedVehicle[] | null>(null);

  useEffect(() => {
    fetch("/api/contractor/vehicles")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, []);

  async function downloadQr(v: SerializedVehicle) {
    try {
      const res = await fetch(`/api/contractor/vehicles/${v.id}/qr`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vehicle-${v.vehicleNumber.replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("QR downloaded");
    } catch {
      toast.error("Failed to download QR");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title="My Vehicles"
          description="Vehicles registered with the site. Download the QR pass and stick it on the windscreen for fast gate scanning."
          actions={
            <AdditionalRequestDialog
              type="VEHICLE"
              trigger={
                <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                  <Plus className="mr-2 h-4 w-4" /> Add More Vehicles
                </Button>
              }
            />
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {items === null ? (
          <Skeleton className="h-64 w-full" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No vehicles yet"
            description="Vehicles are registered when the Admin approves your registration or additional-vehicle request."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>QR ID</TableHead>
                  <TableHead>Currently</TableHead>
                  <TableHead className="text-right">QR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.vehicleNumber}</TableCell>
                    <TableCell>{v.vehicleType}</TableCell>
                    <TableCell>{v.vehicleColour || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{v.vehiclePurpose || "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{v.vehicleMaterials || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{v.vehicleQrId}</TableCell>
                    <TableCell>
                      <span className={
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (v.currentStatus === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-500")
                      }>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {v.currentStatus === "IN" ? "Inside Site" : "Outside"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => downloadQr(v)} className="rounded-lg">
                        <Download className="mr-1.5 h-3.5 w-3.5" /> QR PNG
                      </Button>
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
