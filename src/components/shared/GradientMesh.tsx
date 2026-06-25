import { cn } from "@/lib/utils";

interface GradientMeshProps {
  className?: string;
  withGrid?: boolean;
}

export function GradientMesh({ className, withGrid = true }: GradientMeshProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 mesh-bg opacity-90" />
      {withGrid && (
        <div className="absolute inset-0 grid-pattern dark:opacity-100 opacity-0 transition-opacity" />
      )}
      {withGrid && (
        <div className="absolute inset-0 grid-pattern-light dark:opacity-0 opacity-100 transition-opacity" />
      )}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
    </div>
  );
}
