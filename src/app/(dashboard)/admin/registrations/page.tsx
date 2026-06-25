"use client";

import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import {
  RegistrationsTable,
  type RegistrationRow,
} from "@/components/admin/RegistrationsTable";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegistrationStatus } from "@/types";

export default function RegistrationsListPage() {
  const [items, setItems] = useState<RegistrationRow[] | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<RegistrationStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q.trim()) params.set("q", q.trim());

    setLoading(true);
    fetch(`/api/admin/registrations?${params.toString()}`, { signal: ctrl.signal })
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
          eyebrow="Admin"
          title="Contractor Registrations"
          description="Review and act on contractor registration requests."
          actions={loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {items === null ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <RegistrationsTable items={items} q={q} onQ={setQ} status={status} onStatus={setStatus} />
        )}
      </MotionWrapper>

      {items?.length === 0 && !loading && status === "ALL" && q === "" && (
        <p className="text-sm text-muted-foreground">
          When contractors submit registrations via <code>/contractor-registration</code>, they will appear here.
        </p>
      )}

      {/* small icon import keeps unused suppression happy */}
      <FileText className="hidden" />
    </div>
  );
}
