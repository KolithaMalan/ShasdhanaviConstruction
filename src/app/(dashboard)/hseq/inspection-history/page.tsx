"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, History, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import type { SerializedElectricalEquipment } from "@/lib/tools";

export default function InspectionHistoryPage() {
  const [items, setItems] = useState<SerializedElectricalEquipment[] | null>(null);
  const [status, setStatus] = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/hseq/inspections/history?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [status, q]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ Officer"
          title="Electrical Inspection History"
          description="Every equipment inspection — pass or fail — with auditor details."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="PASSED">Passed</TabsTrigger>
              <TabsTrigger value="FAILED">Failed</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Tool name or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={ClipboardList} title="No inspection records" description="Try a different filter." /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment ID</TableHead>
                  <TableHead>Tool</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspected</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead aria-label="open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id} className="group">
                    <TableCell className="font-mono text-xs">{e.equipmentId}</TableCell>
                    <TableCell className="font-medium">{e.toolName}</TableCell>
                    <TableCell>{e.companyName}</TableCell>
                    <TableCell>
                      <span className={
                        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (e.inspectionStatus === "PASSED"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-red-500/30 bg-red-500/10 text-red-600")
                      }>{e.inspectionStatus}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.inspectedAt ? new Date(e.inspectedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{e.inspectorName || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {e.nextInspectionDue ? new Date(e.nextInspectionDue).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.inspectionStatus === "PASSED" && (
                        <Link href={`/hseq/electrical-equipment/${e.id}/qr-sticker`}
                              className="inline-flex items-center text-sm font-medium text-[--color-brand-ocean] transition-transform group-hover:translate-x-0.5">
                          Stickers <ChevronRight className="ml-0.5 h-4 w-4" />
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         )}
      </MotionWrapper>

      {/* History icon kept for import consistency */}
      <History className="hidden" />
    </div>
  );
}
