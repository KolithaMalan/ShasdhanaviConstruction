"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Download, Eye, FileImage, FileText, Loader2, QrCode, Search, X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface EmployeeRow {
  id: string;
  employeeId: string | null;
  nicNumber: string;
  name: string;
  companyName: string;
  tradeType: string;
  designation: string;
  status: string;
  photoUrl: string | null;
  idCardExpiresAt: string | null;
}

interface Props {
  /** Page title (eg "Employee QR Code Downloads"). */
  title?: string;
  /** Eyebrow shown above the title. */
  eyebrow?: string;
  /** Whether to render the contractor filter dropdown.
   *  CONTRACTOR role won't see it since their list is single-company. */
  showContractorFilter?: boolean;
  /** Detail route prefix (defaults to /admin). For super-admin pass /super-admin. */
  detailRoutePrefix?: string;
}

export function EmployeeQrCodesView({
  title = "Employee QR Code Downloads",
  eyebrow = "Downloads",
  showContractorFilter = true,
  detailRoutePrefix = "/admin",
}: Props) {
  const [contractor, setContractor] = useState<string>("");
  const [nic, setNic] = useState<string>("");
  const [rows, setRows] = useState<EmployeeRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<"zip" | "pdf" | null>(null);

  function load(opts?: { contractor?: string; nic?: string }) {
    setLoading(true);
    const params = new URLSearchParams();
    const c = (opts?.contractor ?? contractor).trim();
    const n = (opts?.nic ?? nic).trim();
    if (c) params.set("contractor", c);
    if (n) params.set("nic", n.toUpperCase());
    fetch(`/api/employees/qr-codes?${params.toString()}`)
      .then((r) => r.json())
      .then((b) => {
        setRows(b.employees ?? []);
        setSelected(new Set());
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load({ contractor: "", nic: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contractorOptions = useMemo(() => {
    if (!rows) return [] as string[];
    return Array.from(new Set(rows.map((r) => r.companyName))).sort();
  }, [rows]);

  function clearFilters() {
    setContractor("");
    setNic("");
    load({ contractor: "", nic: "" });
  }

  function toggleAll() {
    if (!rows) return;
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadSingleQr(id: string) {
    start(() => {
      window.location.href = `/api/employees/${encodeURIComponent(id)}/qr-png`;
    });
  }

  function downloadSingleCard(id: string) {
    start(() => {
      window.location.href = `/api/employees/${encodeURIComponent(id)}/id-card-pdf`;
    });
  }

  async function downloadBulk(kind: "zip" | "pdf") {
    if (selected.size === 0) {
      toast.error("Select at least one employee first.");
      return;
    }
    setBulkBusy(kind);
    try {
      const url =
        kind === "zip"
          ? "/api/employees/bulk-qr-download"
          : "/api/employees/bulk-id-card-pdf";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        toast.error(b.message ?? "Bulk download failed");
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download =
        kind === "zip"
          ? `employee-qrs-${new Date().toISOString().slice(0, 10)}.zip`
          : `idcards-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.success(`Downloaded ${selected.size} ${kind === "zip" ? "QR codes" : "ID cards"}`);
    } finally {
      setBulkBusy(null);
    }
  }

  const empty = rows !== null && rows.length === 0;
  const allSelected = rows !== null && rows.length > 0 && selected.size === rows.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description="Filter inducted and active employees, then download individual QR PNGs / ID-card PDFs, or bulk-download selections as a ZIP or multi-page PDF."
        />
      </MotionWrapper>

      {/* Filters */}
      <MotionWrapper delay={0.04}>
        <form
          onSubmit={(e) => { e.preventDefault(); load(); }}
          className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"
        >
          {showContractorFilter && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Contractor company
              </Label>
              <Select
                value={contractor || "__all__"}
                onValueChange={(v) => setContractor(v === "__all__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All contractors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All contractors</SelectItem>
                  {contractorOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="nic" className="text-xs uppercase tracking-wider text-muted-foreground">
              NIC number
            </Label>
            <Input
              id="nic"
              value={nic}
              onChange={(e) => setNic(e.target.value)}
              placeholder="952341234V or 199523401234"
              className="font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full rounded-lg sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={loading}
              className="w-full rounded-lg sm:w-auto"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </form>
      </MotionWrapper>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <MotionWrapper delay={0.05}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[--color-brand-ocean]/40 bg-[--color-brand-ocean]/5 px-4 py-3">
            <p className="text-sm font-medium">
              {selected.size} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(new Set())}
                className="rounded-lg"
              >
                Clear selection
              </Button>
              <Button
                size="sm"
                onClick={() => downloadBulk("zip")}
                disabled={!!bulkBusy}
                className="rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90"
              >
                {bulkBusy === "zip" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileImage className="mr-2 h-4 w-4" />
                )}
                Download QRs (ZIP)
              </Button>
              <Button
                size="sm"
                onClick={() => downloadBulk("pdf")}
                disabled={!!bulkBusy}
                className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
              >
                {bulkBusy === "pdf" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Download ID Cards (PDF)
              </Button>
            </div>
          </div>
        </MotionWrapper>
      )}

      {/* Table */}
      <MotionWrapper delay={0.08}>
        {rows === null ? (
          <Skeleton className="h-64 w-full" />
        ) : empty ? (
          <EmptyState
            icon={QrCode}
            title="No employees match"
            description="Adjust the filters above, or wait for HSEQ induction to issue QR codes."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-14">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>NIC</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} data-state={selected.has(r.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(r.id)}
                        onCheckedChange={() => toggleRow(r.id)}
                        aria-label={`Select ${r.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      {r.photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={r.photoUrl}
                          alt={r.name}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-border/60"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {r.name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("")}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.nicNumber}</TableCell>
                    <TableCell className="font-mono text-xs">{r.employeeId ?? "—"}</TableCell>
                    <TableCell>{r.companyName}</TableCell>
                    <TableCell>{r.tradeType}</TableCell>
                    <TableCell>
                      <span
                        className={
                          "rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
                          (r.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/30"
                            : "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30")
                        }
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadSingleQr(r.id)}
                          disabled={pending}
                          title="Download QR (PNG)"
                          className="h-8 w-8 rounded-md"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadSingleCard(r.id)}
                          disabled={pending}
                          title="Download ID Card (PDF)"
                          className="h-8 w-8 rounded-md"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          asChild
                          size="icon"
                          variant="ghost"
                          title="View details"
                          className="h-8 w-8 rounded-md"
                        >
                          <Link href={`${detailRoutePrefix}/employees/${r.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
