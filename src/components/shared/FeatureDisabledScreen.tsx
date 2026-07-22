import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shown in place of a dashboard screen the Super Admin has switched off for
 * this role (Super Admin → Role Features).
 */
export function FeatureDisabledScreen({
  featureLabel,
  dashboardPath,
}: {
  featureLabel: string;
  dashboardPath: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
        <Lock className="h-7 w-7" />
      </div>

      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {featureLabel} is unavailable
        </h1>
        <p className="text-sm text-muted-foreground">
          This feature has been switched off for your role by the Super Admin.
          Contact them if you need access restored.
        </p>
      </div>

      <Button asChild variant="outline" className="rounded-lg">
        <Link href={dashboardPath}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
