import { cn } from "@/lib/utils";
import type {
  RegistrationStatus,
  AdditionalRequestStatus,
} from "@/types";

type AnyStatus = RegistrationStatus | AdditionalRequestStatus | string;

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

const styles: Record<string, string> = {
  PENDING:
    "border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-300",
  UNDER_REVIEW:
    "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  APPROVED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  REJECTED:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  CORRECTIONS_REQUESTED:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300",
};

const labels: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CORRECTIONS_REQUESTED: "Corrections Requested",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cls = styles[status] ?? "border-border bg-muted text-foreground";
  const label = labels[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
