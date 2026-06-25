"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut({ callbackUrl: "/" });
        })
      }
    >
      <LogOut className="mr-2 h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
