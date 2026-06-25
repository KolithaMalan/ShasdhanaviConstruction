"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
// eslint-disable-next-line @next/next/no-img-element
import { ArrowLeft, Download, FileText, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";

import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SerializedVehicle } from "@/lib/vehicle";

interface MovementRow {
  id: string; direction: "IN" | "OUT"; scannedAt: string;
  gateLocation: string; scannedByName: string; scanMethod: string;
}

export default function AdminVehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [vehicle, setVehicle] = useState<SerializedVehicle | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [movements, setMovements] = useState<MovementRow[] | null>(null);

  useEffect(() => {
    fetch(`/api/admin/vehicles/${id}`)
      .then((r) => r.json())
      .then((b) => { setVehicle(b.item); setQrDataUrl(b.qrDataUrl); })
      .catch(() => { setVehicle(null); setQrDataUrl(null); });
    fetch(`/api/admin/vehicles/${id}/movements`)
      .then((r) => r.json())
      .then((b) => setMovements(b.items ?? []))
      .catch(() => setMovements([]));
  }, [id]);

  async function downloadPng() {
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/qr`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      triggerDownload(blob, `vehicle-${vehicle?.vehicleNumber.replace(/\s+/g, "-") ?? id}.png`);
      toast.success("QR PNG downloaded");
    } catch { toast.error("Download failed"); }
  }
  async function downloadPdf() {
    try {
      const res = await fetch(`/api/admin/vehicles/${id}/qr-pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      triggerDownload(blob, `vehicle-${vehicle?.vehicleNumber.replace(/\s+/g, "-") ?? id}.pdf`);
      toast.success("Vehicle pass PDF downloaded");
    } catch { toast.error("Download failed"); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/vehicles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to vehicles
      </Link>

      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          {!vehicle ? <Skeleton className="h-16 w-full" /> : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                    {vehicle.vehicleQrId}
                  </p>
                  <h1 className="font-heading text-2xl font-semibold">{vehicle.vehicleNumber}</h1>
                  <p className="text-xs text-muted-foreground">{vehicle.companyName} · {vehicle.vehicleType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={downloadPng} variant="outline" className="rounded-lg">
                  <Download className="mr-2 h-4 w-4" /> QR PNG
                </Button>
                <Button onClick={downloadPdf} className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                  <FileText className="mr-2 h-4 w-4" /> Vehicle Pass PDF
                </Button>
              </div>
            </div>
          )}
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md md:col-span-2">
            <h3 className="mb-3 font-heading text-base font-semibold">Details</h3>
            {!vehicle ? <Skeleton className="h-32 w-full" /> : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Item label="Vehicle Number" value={vehicle.vehicleNumber} />
                <Item label="Type" value={vehicle.vehicleType} />
                <Item label="Colour" value={vehicle.vehicleColour || "—"} />
                <Item label="Purpose" value={vehicle.vehiclePurpose || "—"} />
                <Item label="Status" value={vehicle.status} />
                <Item label="Currently" value={vehicle.currentStatus === "IN" ? "Inside Site" : "Outside"} />
              </dl>
            )}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-md">
            <h3 className="mb-3 font-heading text-base font-semibold">Vehicle QR Pass</h3>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="Vehicle QR" className="mx-auto h-56 w-56 rounded-lg border border-border/60 bg-white p-2" />
            ) : (
              <Skeleton className="mx-auto h-56 w-56 rounded-lg" />
            )}
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">{vehicle?.vehicleQrId ?? ""}</p>
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <h3 className="mb-4 font-heading text-base font-semibold">Gate Movements</h3>
          {movements === null ? <Skeleton className="h-48 w-full" /> :
           movements.length === 0 ? <EmptyState icon={Loader2} title="No movements yet" description="Scans at the gate will appear here." /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{new Date(m.scannedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                    <TableCell>
                      <span className={
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (m.direction === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/30 bg-red-500/10 text-red-600")
                      }>{m.direction}</span>
                    </TableCell>
                    <TableCell>{m.gateLocation}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.scannedByName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.scanMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           )}
        </div>
      </MotionWrapper>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
