import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/lib/auth";
import { roleToDashboard } from "@/config/roles";

import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GradientMesh } from "@/components/shared/GradientMesh";
import { RegistrationForm } from "@/components/registration/RegistrationForm";

export const metadata = { title: "Contractor Self Registration" };

export default async function ContractorRegistrationPage() {
  const session = await auth();
  if (session?.user?.role) {
    redirect(roleToDashboard[session.user.role]);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientMesh />

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="md" />
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[--color-brand-ocean]">
            Contractor Self Registration
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl text-balance">
            Submit your contractor registration request
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Walk through the six steps to register your company, workforce, vehicles
            and equipment. Once submitted, the Shasdhanavi Admin team will review and
            email you with the outcome.
          </p>
        </div>

        <RegistrationForm />
      </main>
    </div>
  );
}
