import { cn } from "@/lib/utils";
import {
  ELECTRICAL_INSPECTION_STATUS_LABELS,
  ELECTRICAL_LIFECYCLE_LABELS,
  NON_ELECTRICAL_TOOL_STATUSES,
  type ElectricalInspectionStatus,
  type ElectricalLifecycleStatus,
  type NonElectricalToolStatus,
} from "@/types";

const inspectionStyles: Record<ElectricalInspectionStatus, string> = {
  PENDING_INSPECTION: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  PASSED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

const lifecycleStyles: Record<ElectricalLifecycleStatus, string> = {
  PENDING_INSPECTION: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  APPROVED_INVENTORY: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  BLOCKED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  REMOVED: "border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400",
};

const nonElectricalStyles: Record<NonElectricalToolStatus, string> = {
  ACTIVE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  DEPLETED: "border-slate-500/30 bg-slate-500/10 text-slate-500 dark:text-slate-400",
  BLOCKED: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
};

const nonElectricalLabels: Record<NonElectricalToolStatus, string> = {
  ACTIVE: "Active",
  DEPLETED: "Depleted",
  BLOCKED: "Blocked",
};

interface Props {
  kind: "inspection" | "lifecycle" | "nonElectrical";
  value: string;
  className?: string;
}

export function InspectionStatusBadge({ kind, value, className }: Props) {
  let style = "";
  let label = value;
  if (kind === "inspection") {
    style = inspectionStyles[value as ElectricalInspectionStatus] ?? "";
    label = ELECTRICAL_INSPECTION_STATUS_LABELS[value as ElectricalInspectionStatus] ?? value;
  } else if (kind === "lifecycle") {
    style = lifecycleStyles[value as ElectricalLifecycleStatus] ?? "";
    label = ELECTRICAL_LIFECYCLE_LABELS[value as ElectricalLifecycleStatus] ?? value;
  } else {
    style = nonElectricalStyles[value as NonElectricalToolStatus] ?? "";
    label = nonElectricalLabels[value as NonElectricalToolStatus] ?? value;
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
      style, className,
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/* Keeping the enum imported so tree-shaking doesn't strip the labels constant. */
export const _types = NON_ELECTRICAL_TOOL_STATUSES;
