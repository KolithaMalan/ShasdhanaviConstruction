"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Camera, IdCard, Loader2, Search, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { WebcamCaptureDialog } from "@/components/hseq/WebcamCaptureDialog";
import { daysUntilExpiry } from "@/lib/idCardExpiry";
import type { SerializedEmployee } from "@/lib/employee";

export default function InductedEmployeesPage() {
  const [items, setItems] = useState<SerializedEmployee[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "DEACTIVATED">("ALL");
  const [loading, setLoading] = useState(false);

  /** Per-row optimistic photo overrides: maps employee id → cache-busted
   *  preview URL after a successful retake. Cleared when the list reloads. */
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});

  const handleRetake = useCallback((employeeId: string, photoUrl: string) => {
    const busted = photoUrl.includes("?")
      ? `${photoUrl}&t=${Date.now()}`
      : `${photoUrl}?t=${Date.now()}`;
    setPhotoOverrides((prev) => ({ ...prev, [employeeId]: busted }));
    setItems((prev) =>
      prev
        ? prev.map((e) => (e.id === employeeId ? { ...e, photoUrl: busted } : e))
        : prev,
    );
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    fetch(`/api/hseq/inducted?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, status]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="HSEQ Officer"
          title="Inducted Employees"
          description="All employees with an issued ID card — active and expired."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <TabsList>
              <TabsTrigger value="ALL">All</TabsTrigger>
              <TabsTrigger value="ACTIVE">Active</TabsTrigger>
              <TabsTrigger value="DEACTIVATED">Deactivated</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Name, NIC or Employee ID…"
                   value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={Users} title="No inducted employees" description="Try a different filter." />
         ) : (
           <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Photo</TableHead>
                   <TableHead>Name</TableHead>
                   <TableHead>Employee ID</TableHead>
                   <TableHead>NIC</TableHead>
                   <TableHead>Contractor</TableHead>
                   <TableHead>Trade</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Expires</TableHead>
                   <TableHead aria-label="actions" />
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((e) => {
                   const dte = daysUntilExpiry(e.idCardExpiresAt);
                   const expiringSoon = e.status === "ACTIVE" && dte !== null && dte >= 0 && dte <= 7;
                   return (
                     <TableRow key={e.id}>
                       <TableCell>
                         <div className="h-8 w-8 overflow-hidden rounded border border-border/60 bg-background">
                           {(photoOverrides[e.id] || e.photoUrl) ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img
                               key={photoOverrides[e.id] || e.photoUrl}
                               src={photoOverrides[e.id] || e.photoUrl}
                               alt={e.name}
                               className="h-full w-full object-cover"
                             />
                           ) : null}
                         </div>
                       </TableCell>
                       <TableCell className="font-medium">{e.name}</TableCell>
                       <TableCell className="font-mono text-xs">{e.employeeId ?? "—"}</TableCell>
                       <TableCell className="font-mono text-xs">{e.nicNumber}</TableCell>
                       <TableCell>{e.companyName}</TableCell>
                       <TableCell>{e.tradeType}</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <EmployeeStatusBadge status={e.status} />
                           {expiringSoon && (
                             <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                               {dte}d
                             </span>
                           )}
                         </div>
                       </TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                         {e.idCardExpiresAt ? new Date(e.idCardExpiresAt).toLocaleDateString("en-GB") : "—"}
                       </TableCell>
                       <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           <WebcamCaptureDialog
                             employeeId={e.id}
                             onSaved={(serverUrl) => handleRetake(e.id, serverUrl)}
                             trigger={
                               <Button
                                 type="button"
                                 size="sm"
                                 variant="outline"
                                 className="h-8 rounded-md"
                                 title="Retake photo"
                               >
                                 <Camera className="mr-1.5 h-3.5 w-3.5" /> Retake
                               </Button>
                             }
                           />
                           {e.employeeId && (
                             <Link
                               href={`/hseq/id-card/${e.employeeId}`}
                               className="inline-flex items-center text-sm font-medium text-[--color-brand-ocean] hover:underline"
                             >
                               <IdCard className="mr-1 h-4 w-4" /> View
                             </Link>
                           )}
                         </div>
                       </TableCell>
                     </TableRow>
                   );
                 })}
               </TableBody>
             </Table>
           </div>
         )}
      </MotionWrapper>
    </div>
  );
}
