"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Boxes, ChevronRight, Loader2, Search, Wrench, Zap } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceBar } from "@/components/admin/tools/BalanceBar";
import { InspectionStatusBadge } from "@/components/admin/tools/InspectionStatusBadge";
import type { SerializedElectricalEquipment, SerializedNonElectricalTool } from "@/lib/tools";

export default function AdminToolsInventoryPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin"
          title="Tools & Equipment Inventory"
          description="Live view of all contractor tools and HSEQ-inspected electrical equipment."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <Tabs defaultValue="electrical">
          <TabsList>
            <TabsTrigger value="electrical"><Zap className="mr-2 h-3.5 w-3.5" /> Electrical</TabsTrigger>
            <TabsTrigger value="non-electrical"><Wrench className="mr-2 h-3.5 w-3.5" /> Non-Electrical</TabsTrigger>
          </TabsList>
          <TabsContent value="electrical" className="mt-4"><ElectricalTab /></TabsContent>
          <TabsContent value="non-electrical" className="mt-4"><NonElectricalTab /></TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  );
}

function ElectricalTab() {
  const [items, setItems] = useState<SerializedElectricalEquipment[] | null>(null);
  const [contractor, setContractor] = useState("ALL");
  const [inspection, setInspection] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (contractor !== "ALL") params.set("contractor", contractor);
    if (inspection !== "ALL") params.set("inspectionStatus", inspection);
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/admin/tools/electrical?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [contractor, inspection, status, q]);

  const contractors = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.companyName))).sort();
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Tool, ID, contractor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={contractor} onValueChange={setContractor}>
          <SelectTrigger className="h-9 w-56"><SelectValue placeholder="All contractors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All contractors</SelectItem>
            {contractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={inspection} onValueChange={setInspection}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Inspection" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any inspection</SelectItem>
            <SelectItem value="PENDING_INSPECTION">Pending</SelectItem>
            <SelectItem value="PASSED">Passed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="PENDING_INSPECTION">Pending Inspection</SelectItem>
            <SelectItem value="APPROVED_INVENTORY">In Inventory</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
            <SelectItem value="REMOVED">Removed</SelectItem>
          </SelectContent>
        </Select>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {items === null ? <Skeleton className="h-64 w-full" /> :
       items.length === 0 ? <EmptyState icon={Zap} title="No electrical equipment" /> : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment ID</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Inspection</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell>{e.category || "—"}</TableCell>
                  <TableCell className="w-32"><BalanceBar current={e.currentBalance} total={e.quantity} /></TableCell>
                  <TableCell><InspectionStatusBadge kind="inspection" value={e.inspectionStatus} /></TableCell>
                  <TableCell><InspectionStatusBadge kind="lifecycle" value={e.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {e.nextInspectionDue ? new Date(e.nextInspectionDue).toLocaleDateString("en-GB") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/tools-inventory/electrical/${e.id}`}
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
    </div>
  );
}

function NonElectricalTab() {
  const [items, setItems] = useState<SerializedNonElectricalTool[] | null>(null);
  const [contractor, setContractor] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (contractor !== "ALL") params.set("contractor", contractor);
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/admin/tools/non-electrical?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [contractor, status, q]);

  const contractors = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.companyName))).sort();
  }, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 pl-9" placeholder="Tool, ID, contractor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={contractor} onValueChange={setContractor}>
          <SelectTrigger className="h-9 w-56"><SelectValue placeholder="All contractors" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All contractors</SelectItem>
            {contractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Any status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DEPLETED">Depleted</SelectItem>
            <SelectItem value="BLOCKED">Blocked</SelectItem>
          </SelectContent>
        </Select>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {items === null ? <Skeleton className="h-64 w-full" /> :
       items.length === 0 ? <EmptyState icon={Boxes} title="No tools" /> : (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool ID</TableHead>
                <TableHead>Tool</TableHead>
                <TableHead>Contractor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead aria-label="open" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id} className="group">
                  <TableCell className="font-mono text-xs">{t.toolId}</TableCell>
                  <TableCell className="font-medium">{t.toolName}</TableCell>
                  <TableCell>{t.companyName}</TableCell>
                  <TableCell>{t.category || "—"}</TableCell>
                  <TableCell className="w-32"><BalanceBar current={t.currentBalance} total={t.approvedQuantity} /></TableCell>
                  <TableCell>{t.unit}</TableCell>
                  <TableCell><InspectionStatusBadge kind="nonElectrical" value={t.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.approvalDate ? new Date(t.approvalDate).toLocaleDateString("en-GB") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/tools-inventory/non-electrical/${t.id}`}
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
    </div>
  );
}
