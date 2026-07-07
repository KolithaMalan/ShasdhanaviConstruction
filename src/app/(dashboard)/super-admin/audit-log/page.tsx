"use client";

import { useEffect, useState } from "react";
import { ClipboardList, FileSpreadsheet, FileText, Loader2, Search } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AUDIT_ACTIONS } from "@/types";

interface Row {
  id: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [action, setAction] = useState("ALL");
  const [q, setQ] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  function buildParams() {
    const params = new URLSearchParams();
    if (action !== "ALL") params.set("action", action);
    if (q.trim()) params.set("userEmail", q.trim());
    if (from) params.set("startDate", from);
    if (to) params.set("endDate", to);
    return params;
  }

  function load() {
    const params = buildParams();
    params.set("limit", "200");
    setLoading(true);
    fetch(`/api/super-admin/audit-log?${params}`)
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, [action]); // eslint-disable-line

  function exportAs(format: "excel" | "pdf") {
    const params = buildParams();
    params.set("format", format);
    window.open(`/api/super-admin/audit-log?${params}`, "_blank");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="Audit Log"
          description="Every significant action across the system, immutable and read-only."
          actions={
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => exportAs("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" onClick={() => exportAs("pdf")}>
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
            </div>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          <Field id="from" label="From" type="date" value={from} onChange={setFrom} />
          <Field id="to" label="To" type="date" value={to} onChange={setTo} />
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Action</label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-10 w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any action</SelectItem>
                {AUDIT_ACTIONS.map((a) => <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:flex-1">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email contains</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 pl-9" placeholder="email@…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <button type="button" onClick={load}
                  className="h-10 rounded-lg bg-[--color-brand-ocean] px-4 text-sm font-medium text-white hover:bg-[--color-brand-ocean]/90">
            Apply
          </button>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         items.length === 0 ? <EmptyState icon={ClipboardList} title="No audit records" /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{new Date(r.createdAt).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" })}</TableCell>
                    <TableCell>
                      <div className="text-sm">{r.userName || "—"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{r.userEmail}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.userRole}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                        {r.action.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{r.description || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.entityType ? `${r.entityType}/${r.entityId || "*"}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{r.ipAddress || "—"}</TableCell>
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

function Field({ id, label, type = "text", value, onChange }: { id: string; label: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-10" />
    </div>
  );
}
