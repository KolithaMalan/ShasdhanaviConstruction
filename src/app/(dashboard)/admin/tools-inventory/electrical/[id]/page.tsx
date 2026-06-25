"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceBar } from "@/components/admin/tools/BalanceBar";
import { InspectionStatusBadge } from "@/components/admin/tools/InspectionStatusBadge";
import type { SerializedElectricalEquipment } from "@/lib/tools";

interface MovementRow {
  id: string; direction: "IN" | "OUT"; quantity: number;
  balanceBefore: number; balanceAfter: number;
  gatePassId: string; processedAt: string; processedByName: string; notes: string;
}

export default function AdminElectricalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<SerializedElectricalEquipment | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [movements, setMovements] = useState<MovementRow[] | null>(null);

  useEffect(() => {
    fetch(`/api/admin/tools/electrical/${id}`)
      .then((r) => r.json())
      .then((b) => { setItem(b.item); setQrDataUrl(b.qrDataUrl); })
      .catch(() => { setItem(null); setQrDataUrl(null); });
    fetch(`/api/admin/tools/electrical/${id}/movements`)
      .then((r) => r.json())
      .then((b) => setMovements(b.items ?? []))
      .catch(() => setMovements([]));
  }, [id]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/admin/tools-inventory" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </Link>

      <MotionWrapper>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          {!item ? <Skeleton className="h-16 w-full" /> : (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--color-brand-ocean]/15 text-[--color-brand-ocean]">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
                    {item.equipmentId}
                  </p>
                  <h1 className="font-heading text-2xl font-semibold">{item.toolName}</h1>
                  <p className="text-xs text-muted-foreground">{item.companyName} · {item.category || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <InspectionStatusBadge kind="inspection" value={item.inspectionStatus} />
                <InspectionStatusBadge kind="lifecycle" value={item.status} />
              </div>
            </div>
          )}
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md md:col-span-2">
            <h3 className="mb-3 font-heading text-base font-semibold">Equipment Details</h3>
            {!item ? <Skeleton className="h-32 w-full" /> : (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Item label="Approved Qty" value={String(item.quantity)} />
                <Item label="Serial" value={item.serialNumber || "—"} mono />
                <Item label="Power" value={item.powerDetails || "—"} />
                <Item label="Inspected" value={item.inspectedAt ? new Date(item.inspectedAt).toLocaleDateString("en-GB") : "—"} />
                <Item label="Inspector" value={item.inspectorName || "—"} />
                <Item label="Next Due" value={item.nextInspectionDue ? new Date(item.nextInspectionDue).toLocaleDateString("en-GB") : "—"} />
                <div className="col-span-2">
                  <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Balance</dt>
                  <div className="mt-1 max-w-xs">
                    <BalanceBar current={item.currentBalance} total={item.quantity} />
                  </div>
                </div>
                {item.inspectionNotes && (
                  <div className="col-span-2">
                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Inspection Notes</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-border/60 bg-background/40 p-3 text-sm">{item.inspectionNotes}</dd>
                  </div>
                )}
                {item.failureReason && (
                  <div className="col-span-2">
                    <dt className="text-[10px] uppercase tracking-wider text-red-600">Failure Reason</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-sm">{item.failureReason}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center backdrop-blur-md">
            <h3 className="mb-3 font-heading text-base font-semibold">QR Code</h3>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR" className="mx-auto h-56 w-56 rounded-lg border border-border/60 bg-white p-2" />
            ) : <Skeleton className="mx-auto h-56 w-56 rounded-lg" />}
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">{item?.equipmentId ?? ""}</p>
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md">
          <h3 className="mb-4 font-heading text-base font-semibold">Movement History</h3>
          {movements === null ? <Skeleton className="h-48 w-full" /> :
           movements.length === 0 ? <EmptyState icon={Zap} title="No movements yet" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead><TableHead>Direction</TableHead>
                  <TableHead>Qty</TableHead><TableHead>Before</TableHead>
                  <TableHead>After</TableHead><TableHead>Gate Pass</TableHead>
                  <TableHead>Officer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{new Date(m.processedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                    <TableCell>
                      <span className={
                        "rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (m.direction === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/30 bg-red-500/10 text-red-600")
                      }>{m.direction}</span>
                    </TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.balanceBefore}</TableCell>
                    <TableCell className="text-xs font-medium">{m.balanceAfter}</TableCell>
                    <TableCell className="font-mono text-xs">{m.gatePassId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.processedByName}</TableCell>
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

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"mt-0.5 text-sm font-medium text-foreground " + (mono ? "font-mono" : "")}>{value}</dd>
    </div>
  );
}
