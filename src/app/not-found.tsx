import Link from "next/link";
import { ArrowLeft, ShieldOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GradientMesh } from "@/components/shared/GradientMesh";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <GradientMesh />
      <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-card/70 p-10 text-center backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <ShieldOff className="h-7 w-7" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Restricted area
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you tried to access does not exist or your role does not
          have clearance for it.
        </p>
        <Button asChild className="mt-6 rounded-lg">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to welcome
          </Link>
        </Button>
      </div>
    </div>
  );
}
