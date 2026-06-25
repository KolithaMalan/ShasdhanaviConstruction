"use client";

import { useEffect, useState } from "react";
import { Users, Search, UserPlus, FileDown, QrCode, Download } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmployeeStatusBadge } from "@/components/shared/EmployeeStatusBadge";
import { AdditionalRequestDialog } from "@/components/contractor/AdditionalRequestDialog";
import { calculateWorkingDays } from "@/lib/working-days";
import { toast } from "sonner";
import type { SerializedEmployee } from "@/lib/employee";

export default function ContractorEmployeesPage() {
  const [items, setItems] = useState<SerializedEmployee[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/contractor/employees")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const filtered = (items ?? []).filter((e) => {
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return e.name.toLowerCase().includes(t) || e.nicNumber.toLowerCase().includes(t);
  });

  async function downloadPdf() {
    try {
      const res = await fetch("/api/contractor/reports/working-days");
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "working-days-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to download report");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title="My Employees"
          description="Track your workforce through medical → induction → active site access."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={downloadPdf} className="rounded-lg">
                <FileDown className="mr-2 h-4 w-4" /> Working-Days PDF
              </Button>
              <AdditionalRequestDialog
                type="LABOUR"
                trigger={
                  <Button className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
                    <UserPlus className="mr-2 h-4 w-4" /> Add More Employees
                  </Button>
                }
              />
            </div>
          }
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 pl-9" placeholder="Search by name or NIC…"
                 value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.08}>
        {items === null ? (
          <Skeleton className="h-64 w-full" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Employees are created when the Admin approves your registration or additional-labour request."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Working Days</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => {
                  const canDownload =
                    !!e.qrCodeData &&
                    (e.status === "ACTIVE" || e.status === "INDUCTION_COMPLETED");
                  return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell className="font-mono text-xs">{e.nicNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{e.employeeId ?? "—"}</TableCell>
                    <TableCell>{e.tradeType}</TableCell>
                    <TableCell><EmployeeStatusBadge status={e.status} /></TableCell>
                    <TableCell>{e.joinedDate ? new Date(e.joinedDate).toLocaleDateString("en-GB") : "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {e.joinedDate ? calculateWorkingDays(e.joinedDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          disabled={!canDownload}
                          title={canDownload ? "Download QR (PNG)" : "QR not yet issued"}
                          className="h-8 w-8 rounded-md"
                        >
                          <a
                            href={`/api/employees/${e.id}/qr-png`}
                            aria-disabled={!canDownload}
                            tabIndex={canDownload ? 0 : -1}
                          >
                            <QrCode className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                          disabled={!canDownload}
                          title={canDownload ? "Download ID Card (PDF)" : "ID card not yet issued"}
                          className="h-8 w-8 rounded-md"
                        >
                          <a
                            href={`/api/employees/${e.id}/id-card-pdf`}
                            aria-disabled={!canDownload}
                            tabIndex={canDownload ? 0 : -1}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
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
