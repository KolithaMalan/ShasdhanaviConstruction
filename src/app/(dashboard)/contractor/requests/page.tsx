"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { MotionWrapper } from "@/components/shared/MotionWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

interface Row {
  id: string;
  requestType: string;
  itemCount: number;
  status: string;
  adminNotes: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export default function ContractorRequestsPage() {
  const [items, setItems] = useState<Row[] | null>(null);

  useEffect(() => {
    fetch("/api/contractor/requests")
      .then((r) => r.json())
      .then((b) => setItems(b.items ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <MotionWrapper>
        <PageHeader
          eyebrow="Contractor"
          title="My Requests"
          description="Status and history of your additional requests."
        />
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        {items === null ? (
          <Skeleton className="h-64 w-full" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests submitted yet"
            description="Additional requests (employees, vehicles, equipment) will appear here."
          />
        ) : (
          <div className="space-y-3">
            {items.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-base font-semibold">
                        {r.requestType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                      </h3>
                      <span className="text-xs text-muted-foreground">· {r.itemCount} item{r.itemCount === 1 ? "" : "s"}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {new Date(r.submittedAt).toLocaleString("en-GB")}
                      {r.reviewedAt && (
                        <> · Reviewed {new Date(r.reviewedAt).toLocaleString("en-GB")}</>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.adminNotes && (
                  <div className="mt-3 rounded-lg border-l-4 border-amber-500/60 bg-amber-500/5 p-3 text-sm text-foreground whitespace-pre-wrap">
                    <p className="mb-1 text-[10px] uppercase tracking-wider text-amber-600">Admin Notes</p>
                    {r.adminNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </MotionWrapper>
    </div>
  );
}
