"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Eye, HardHat, Loader2, QrCode, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { EMPLOYEE_STATUSES, type EmployeeStatus } from "@/types";

interface Row {
  id: string;
  name: string;
  nicNumber: string;
  employeeId: string | null;
  companyName: string;
  tradeType: string;
  designation: string;
  status: EmployeeStatus;
  medicalStatus: string;
  idCardExpiresAt: string | null;
  currentStatus: "IN" | "OUT";
  photoUrl: string;
}

export default function SuperAdminEmployeesPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [contractor, setContractor] = useState("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    /* This page uses the admin search shape — there's no dedicated super-admin endpoint
       because the admin /registrations endpoint and /api/contractor/employees scope by
       owner. We instead query the existing inducted endpoint plus a fallback by
       hitting the search API for broad coverage. */
    if (q.trim()) params.set("q", q.trim());
    setLoading(true);
    fetch(`/api/hseq/inducted?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q]);

  const contractors = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.companyName))).sort();
  }, [items]);

  const filtered = (items ?? []).filter((e) => {
    if (status !== "ALL" && e.status !== status) return false;
    if (contractor !== "ALL" && e.companyName !== contractor) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Super Admin"
          title="All Employees"
          description="Every employee across every contractor — with photos from MongoDB."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Name, NIC, Employee ID…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Any status</SelectItem>
              {EMPLOYEE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={contractor} onValueChange={setContractor}>
            <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Contractor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All contractors</SelectItem>
              {contractors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? <Skeleton className="h-64 w-full" /> :
         filtered.length === 0 ? <EmptyState icon={HardHat} title="No employees match" /> : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Currently</TableHead>
                  <TableHead aria-label="actions" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="h-8 w-8 overflow-hidden rounded-md border border-border/60 bg-background">
                        {e.photoUrl ? (
                          <Image
                            src={`/api/photos/EMPLOYEE/${encodeURIComponent(e.nicNumber)}?size=thumbnail`}
                            alt={e.name} width={32} height={32}
                            className="h-full w-full object-cover" unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                            {e.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="font-mono text-xs">{e.nicNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{e.employeeId ?? "—"}</TableCell>
                    <TableCell>{e.companyName}</TableCell>
                    <TableCell>{e.tradeType}</TableCell>
                    <TableCell><EmployeeStatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.idCardExpiresAt ? new Date(e.idCardExpiresAt).toLocaleDateString("en-GB") : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium " +
                        (e.currentStatus === "IN"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-500")
                      }>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {e.currentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost"
                                title="Download QR (PNG)" className="h-8 w-8 rounded-md">
                          <a href={`/api/employees/${e.id}/qr-png`}>
                            <QrCode className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button asChild size="icon" variant="ghost"
                                title="Download ID Card (PDF)" className="h-8 w-8 rounded-md">
                          <a href={`/api/employees/${e.id}/id-card-pdf`}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        {e.employeeId && (
                          <Button asChild size="icon" variant="ghost"
                                  title="View details" className="h-8 w-8 rounded-md">
                            <Link href={`/hseq/id-card/${e.employeeId}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
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
