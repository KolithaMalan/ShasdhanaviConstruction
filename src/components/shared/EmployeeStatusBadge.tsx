import { cn } from "@/lib/utils";
import { EMPLOYEE_STATUS_LABELS, type EmployeeStatus } from "@/types";

interface Props {
  status: EmployeeStatus | string;
  className?: string;
}

const styles: Record<string, string> = {
  PENDING_MEDICAL:     "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  MEDICAL_PASSED:      "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300",
  MEDICAL_REJECTED:    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  INDUCTION_COMPLETED: "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  ACTIVE:              "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  DEACTIVATED:         "border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400",
  BLOCKED:             "border-red-700/30 bg-red-700/10 text-red-700 dark:text-red-400",
};

export function EmployeeStatusBadge({ status, className }: Props) {
  const cls = styles[status] ?? "border-border bg-muted text-foreground";
  const label = EMPLOYEE_STATUS_LABELS[status as EmployeeStatus] ?? status;

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
