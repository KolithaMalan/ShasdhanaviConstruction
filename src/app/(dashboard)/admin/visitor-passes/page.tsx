"use client";

import { useEffect, useState, useTransition } from "react";
import { Download, IdCard, Loader2, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";

interface Row {
  id: string;
  passId: string;
  currentStatus: "AVAILABLE" | "IN_USE";
  currentVisitor: null | { name: string; nicNumber: string; enteredAt: string };
  createdAt: string | null;
}

export default function AdminVisitorPassesPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [count, setCount] = useState(1);
  const [pending, start] = useTransition();

  function load() {
    fetch("/api/admin/visitor-passes")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }
  useEffect(load, []);

  function createPasses() {
    start(async () => {
      const res = await fetch("/api/admin/visitor-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.message ?? "Failed"); return; }
      toast.success(`Created ${body.created?.length ?? 0} pass${body.created?.length === 1 ? "" : "es"}`);
      load();
    });
  }

  async function downloadQr(row: Row) {
    try {
      const res = await fetch(`/api/admin/visitor-passes/${row.id}/qr`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visitor-pass-${row.passId}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${row.passId}.png`);
    } catch { toast.error("Failed to download QR"); }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin"
          title="Visitor Passes"
          description="Reusable visitor QR passes. Print, hand to a visitor, and the security officer scans them at the gate."
          actions={
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="h-10 w-24"
                aria-label="How many to create"
              />
              <Button onClick={createPasses} disabled={pending}
                      className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Pass(es)
              </Button>
              <Button variant="outline" onClick={load} className="rounded-lg">
                <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? (
           <EmptyState
             icon={IdCard}
             title="No visitor passes yet"
             description="Create a batch of passes, print their QR codes, and laminate them as physical badges."
           />
         ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pass ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Visitor</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">QR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm font-medium">{r.passId}</TableCell>
                    <TableCell>
                      <span className={
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (r.currentStatus === "AVAILABLE"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600")
                      }>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {r.currentStatus === "AVAILABLE" ? "Available" : "In Use"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.currentVisitor ? (
                        <div>
                          <div className="text-sm font-medium">{r.currentVisitor.name}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{r.currentVisitor.nicNumber}</div>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => downloadQr(r)} className="rounded-lg">
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
