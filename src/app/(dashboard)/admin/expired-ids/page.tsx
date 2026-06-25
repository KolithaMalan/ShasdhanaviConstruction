"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, Loader2, RefreshCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SerializedEmployee } from "@/lib/employee";

export default function ExpiredIdsPage() {
  const [items, setItems] = useState<SerializedEmployee[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<SerializedEmployee | null>(null);
  const [pending, start] = useTransition();

  function load() {
    setLoading(true);
    fetch("/api/admin/expired-ids")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function reactivate(e: SerializedEmployee) {
    start(async () => {
      const res = await fetch(`/api/admin/employees/${e.id}/reactivate-id`, { method: "PATCH" });
      const b = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(b.message ?? "Failed"); return; }
      toast.success("ID reactivated for 2 months");
      setActive(null);
      load();
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin"
          title="Expired ID Cards"
          description="ID cards that auto-deactivated after 2 months. Reactivate to issue a fresh 2-month validity window."
          actions={
            <Button variant="outline" onClick={load} disabled={loading} className="rounded-lg">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState icon={Clock} title="No expired IDs"
                       description="When an ID card hits 2 months, it will appear here for reactivation." />
         ) : (
           <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Name</TableHead>
                   <TableHead>Employee ID</TableHead>
                   <TableHead>NIC</TableHead>
                   <TableHead>Contractor</TableHead>
                   <TableHead>Trade</TableHead>
                   <TableHead>Expired</TableHead>
                   <TableHead aria-label="actions" />
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {items.map((e) => (
                   <TableRow key={e.id}>
                     <TableCell className="font-medium">{e.name}</TableCell>
                     <TableCell className="font-mono text-xs">{e.employeeId ?? "—"}</TableCell>
                     <TableCell className="font-mono text-xs">{e.nicNumber}</TableCell>
                     <TableCell>{e.companyName}</TableCell>
                     <TableCell>{e.tradeType}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {e.idCardExpiresAt ? new Date(e.idCardExpiresAt).toLocaleDateString("en-GB") : "—"}
                     </TableCell>
                     <TableCell className="text-right">
                       <Button size="sm" onClick={() => setActive(e)} disabled={pending}
                               className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90">
                         <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
         )}
      </MotionWrapper>

      <AlertDialog open={!!active} onOpenChange={(v) => { if (!v) setActive(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate ID card?</AlertDialogTitle>
            <AlertDialogDescription>
              {active?.name}'s ID card will be reactivated for another 2 months from today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(ev) => { ev.preventDefault(); if (active) reactivate(active); }}
              disabled={pending}
              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
