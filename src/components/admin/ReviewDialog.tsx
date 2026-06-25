"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  variant: "approve" | "reject" | "corrections";
  requireNotes?: boolean;
  onConfirm: (notes: string) => Promise<void>;
}

const variants = {
  approve: "bg-emerald-600 hover:bg-emerald-600/90 text-white",
  reject:  "bg-red-600 hover:bg-red-600/90 text-white",
  corrections: "bg-amber-500 hover:bg-amber-500/90 text-white",
};

export function ReviewDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  variant,
  requireNotes = false,
  onConfirm,
}: ReviewDialogProps) {
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {requireNotes ? "Notes (required)" : "Notes (optional)"}
          </label>
          <Textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              variant === "reject"
                ? "Explain why this registration is being rejected…"
                : variant === "corrections"
                ? "Describe the corrections required from the contractor…"
                : "Optional notes — visible to the contractor."
            }
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending || (requireNotes && notes.trim().length === 0)}
            onClick={async (e) => {
              e.preventDefault();
              setPending(true);
              try {
                await onConfirm(notes.trim());
                onOpenChange(false);
                setNotes("");
              } finally {
                setPending(false);
              }
            }}
            className={cn(variants[variant])}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
