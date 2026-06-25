"use client";

import { useEffect, useState } from "react";
import { Ban, Search, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface Row {
  id: string; nicNumber: string; name: string; reason: string;
  blacklistedBy: string; blacklistedAt: string; originalContractor: string;
}

export default function MedicalBlacklistPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    fetch(`/api/medical/blacklist?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Medical Officer"
          title="Blacklisted NICs"
          description="NIC numbers permanently blocked from site access following failed medical screening."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Search NIC or name…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={Ban} title="No blacklisted NICs"
                       description="When a medical officer rejects an employee, their NIC will be added here." />
         ) : (
           <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>NIC</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Reason</TableHead>
                   <TableHead>Blacklisted By</TableHead>
                   <TableHead>Date</TableHead>
                   <TableHead>Original Contractor</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((r) => (
                   <TableRow key={r.id}>
                     <TableCell className="font-mono text-xs font-medium">{r.nicNumber}</TableCell>
                     <TableCell>{r.name || "—"}</TableCell>
                     <TableCell className="max-w-[260px] truncate text-sm text-muted-foreground">{r.reason || "—"}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">{r.blacklistedBy}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {r.blacklistedAt ? new Date(r.blacklistedAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—"}
                     </TableCell>
                     <TableCell>{r.originalContractor || "—"}</TableCell>
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
