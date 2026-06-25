import { cn } from "@/lib/utils";

interface Props {
  current: number;
  total: number;
  className?: string;
}

/** Shows "X / Y" with a thin progress bar coloured by remaining ratio. */
export function BalanceBar({ current, total, className }: Props) {
  const safeTotal = Math.max(1, total);
  const ratio = Math.max(0, Math.min(1, current / safeTotal));
  const tone =
    ratio < 0.2 ? "bg-red-500"
      : ratio < 0.5 ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between font-mono text-[11px]">
        <span className="font-semibold text-foreground">{current}</span>
        <span className="text-muted-foreground">/ {total}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}
