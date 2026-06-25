"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, PlusCircle, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ADDITIONAL_REQUEST_TYPES,
  type AdditionalRequestStatus,
  type AdditionalRequestType,
} from "@/types";

interface Row {
  id: string;
  companyName: string;
  requestType: AdditionalRequestType;
  itemCount: number;
  status: AdditionalRequestStatus;
  submittedAt: string;
}

const STATUS_TABS: { value: AdditionalRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CORRECTIONS_REQUESTED", label: "Corrections" },
];

const TYPE_TABS: { value: AdditionalRequestType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Types" },
  { value: "LABOUR", label: "Labour" },
  { value: "VEHICLE", label: "Vehicle" },
  { value: "ELECTRICAL_EQUIPMENT", label: "Electrical" },
  { value: "NON_ELECTRICAL_TOOLS", label: "Non-Electrical" },
];

export default function AdditionalRequestsPage() {
  const [items, setItems] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<AdditionalRequestStatus | "ALL">("ALL");
  const [type, setType] = useState<AdditionalRequestType | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (type !== "ALL") params.set("type", type);

    setLoading(true);
    fetch(`/api/admin/additional-requests?${params}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch((e) => { if (e.name !== "AbortError") setItems([]); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [status, type]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Admin"
          title="Additional Requests"
          description="Approve additional labour, vehicles, or equipment requested by existing contractors."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs value={status} onValueChange={(v) => setStatus(v as AdditionalRequestStatus | "ALL")}>
            <TabsList className="flex-wrap">
              {STATUS_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Tabs value={type} onValueChange={(v) => setType(v as AdditionalRequestType | "ALL")}>
            <TabsList className="flex-wrap">
              {TYPE_TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        {items === null ? (
          <Skeleton className="h-64 w-full" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={PlusCircle}
            title="No additional requests"
            description="When contractors submit additional resource requests, they will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead aria-label="open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell className="font-medium">{r.companyName}</TableCell>
                    <TableCell>{prettyType(r.requestType)}</TableCell>
                    <TableCell className="text-center">{r.itemCount}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.submittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/additional-requests/${r.id}`}
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
      </MotionWrapper>

      {/* keep import suppression */}
      <div className="hidden">{ADDITIONAL_REQUEST_TYPES.length}</div>
    </div>
  );
}

function prettyType(t: AdditionalRequestType): string {
  return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
