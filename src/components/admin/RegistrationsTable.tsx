"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText } from "lucide-react";
import type { RegistrationStatus } from "@/types";

export interface RegistrationRow {
  id: string;
  companyName: string;
  email: string;
  scopeOfWork: string;
  labourCount: number;
  vehicleCount: number;
  status: RegistrationStatus;
  submittedAt: string;
}

interface Props {
  items: RegistrationRow[];
  q: string;
  onQ: (v: string) => void;
  status: RegistrationStatus | "ALL";
  onStatus: (v: RegistrationStatus | "ALL") => void;
}

const STATUS_TABS: { value: RegistrationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CORRECTIONS_REQUESTED", label: "Corrections" },
];

export function RegistrationsTable({ items, q, onQ, status, onStatus }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(v) => onStatus(v as RegistrationStatus | "ALL")}>
          <TabsList className="flex-wrap">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company or email…"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead className="text-center">Labour</TableHead>
              <TableHead className="text-center">Vehicles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead aria-label="open" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((r) => (
              <TableRow key={r.id} className="group">
                <TableCell>
                  <div className="font-medium">{r.companyName}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{r.email}</div>
                </TableCell>
                <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">{r.scopeOfWork}</TableCell>
                <TableCell className="text-center">{r.labourCount}</TableCell>
                <TableCell className="text-center">{r.vehicleCount}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(r.submittedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/registrations/${r.id}`}
                    className="inline-flex items-center text-sm font-medium text-[--color-brand-ocean] transition-transform group-hover:translate-x-0.5"
                  >
                    Open <ChevronRight className="ml-0.5 h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No registrations found"
          description="Try adjusting your filter or search."
        />
      )}
    </div>
  );
}
