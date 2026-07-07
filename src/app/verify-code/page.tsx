import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Verify Code — Sahasdhanavi Construction",
};

/**
 * Standalone verification landing page. The actual code-entry step is
 * presented inline on the welcome / login screen after credentials are
 * validated. This page exists so a contractor who arrives here via an
 * email link can be guided back to the live verification flow.
 */
export default function VerifyCodePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[--color-brand-navy] p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-card/70 p-8 text-center backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-semibold">First-Time Verification</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Contractors are asked for a one-time 5-digit code on their very first sign-in.
          After verifying once, future sign-ins use just your email and password.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          The code is valid for 10 minutes. After 5 incorrect attempts, the account is locked for 15 minutes.
        </p>
        <Button asChild className="mt-6 h-11 w-full rounded-lg bg-[--color-brand-ocean] text-white hover:bg-[--color-brand-ocean]/90">
          <Link href="/">Continue to Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
