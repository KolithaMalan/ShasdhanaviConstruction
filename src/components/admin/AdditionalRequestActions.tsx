"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ReviewDialog } from "@/components/admin/ReviewDialog";
import type { AdditionalRequestStatus } from "@/types";

interface Props { id: string; status: AdditionalRequestStatus }

export function AdditionalRequestActions({ id, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [correctionsOpen, setCorrectionsOpen] = useState(false);

  const canAct = status === "PENDING" || status === "CORRECTIONS_REQUESTED";

  async function call(path: string, notes?: string) {
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notes ?? "" }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.message ?? "Action failed");
    }
  }

  if (!canAct) {
    return (
      <p className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
        This request has been {status.toLowerCase().replace(/_/g, " ")} and cannot be modified.
      </p>
    );
  }

  return (
    <>
      <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-border/60 bg-card/80 p-3 backdrop-blur-xl">
        <Button variant="outline" onClick={() => setCorrectionsOpen(true)} disabled={pending}
                className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
          <AlertTriangle className="mr-2 h-4 w-4" /> Request Corrections
        </Button>
        <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={pending}
                className="border-red-500/40 text-red-600 hover:bg-red-500/10">
          <XCircle className="mr-2 h-4 w-4" /> Reject
        </Button>
        <Button onClick={() => setApproveOpen(true)} disabled={pending}
                className="bg-emerald-600 text-white hover:bg-emerald-600/90">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
        </Button>
      </div>

      <ReviewDialog
        open={approveOpen} onOpenChange={setApproveOpen}
        title="Approve this request?" description="Items will be added to the contractor's records."
        confirmLabel="Approve" variant="approve"
        onConfirm={async (notes) => {
          start(async () => {
            try {
              await call(`/api/admin/additional-requests/${id}/approve`, notes);
              toast.success("Request approved");
              router.refresh();
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          });
        }}
      />
      <ReviewDialog
        open={rejectOpen} onOpenChange={setRejectOpen}
        title="Reject this request?" description="The contractor will be notified."
        confirmLabel="Reject" variant="reject" requireNotes
        onConfirm={async (notes) => {
          start(async () => {
            try {
              await call(`/api/admin/additional-requests/${id}/reject`, notes);
              toast.success("Request rejected");
              router.refresh();
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          });
        }}
      />
      <ReviewDialog
        open={correctionsOpen} onOpenChange={setCorrectionsOpen}
        title="Request corrections?" description="The contractor will receive your notes by email."
        confirmLabel="Send Request" variant="corrections" requireNotes
        onConfirm={async (notes) => {
          start(async () => {
            try {
              await call(`/api/admin/additional-requests/${id}/corrections`, notes);
              toast.success("Correction request sent");
              router.refresh();
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          });
        }}
      />
    </>
  );
}
