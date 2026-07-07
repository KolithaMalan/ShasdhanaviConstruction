import { Wrench } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { SignOutButton } from "@/components/shared/SignOutButton";

/**
 * Full-screen block shown to non-Super-Admin users while the platform is in
 * maintenance mode. Super Admins bypass this so they can keep working.
 */
export function MaintenanceScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Logo size="lg" />

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[--color-brand-ocean] to-[--color-brand-sky] text-white">
        <Wrench className="h-8 w-8" />
      </div>

      <div className="max-w-md space-y-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          We&rsquo;ll be back soon
        </h1>
        <p className="text-sm text-muted-foreground">
          {message?.trim()
            ? message
            : "The platform is currently undergoing scheduled maintenance. Please check back shortly."}
        </p>
      </div>

      <SignOutButton variant="outline" className="rounded-lg" />
    </div>
  );
}
