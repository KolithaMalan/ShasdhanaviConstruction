"use client";

import { useEffect, useState } from "react";
import { Search, ClipboardList, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";

interface Row {
  id: string; name: string; nicNumber: string; contractor: string;
  trade: string; medicalStatus: "PASSED" | "FAILED";
  medicalDocumentId: string; bloodType: string; medicalRejectionReason: string;
  screenedAt: string; screenedBy: string;
}

export default function MedicalHistoryPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "PASSED" | "FAILED">("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    fetch(`/api/medical/history?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [q, status]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader eyebrow="Medical Officer" title="Screening History"
                    description="Audit trail of every medical screening decision."
                    actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null} />
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
            <Input className="h-9 pl-9" placeholder="Name or NIC…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={ClipboardList} title="No screening records" description="Try a different filter." />
         ) : (
           <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Name</TableHead>
                   <TableHead>NIC</TableHead>
                   <TableHead>Contractor</TableHead>
                   <TableHead>Result</TableHead>
                   <TableHead>Document ID</TableHead>
                   <TableHead>Blood</TableHead>
                   <TableHead>Officer</TableHead>
                   <TableHead>When</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((r) => (
                   <TableRow key={r.id}>
                     <TableCell className="font-medium">{r.name}</TableCell>
                     <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                     <TableCell>{r.contractor}</TableCell>
                     <TableCell>
                       <span className={"inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                         (r.medicalStatus === "PASSED"
                           ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                           : "border-red-500/30 bg-red-500/10 text-red-600")}>
                         {r.medicalStatus}
                       </span>
                     </TableCell>
                     <TableCell className="font-mono text-xs">{r.medicalDocumentId || "—"}</TableCell>
                     <TableCell>{r.bloodType || "—"}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">{r.screenedBy}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {r.screenedAt ? new Date(r.screenedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
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
