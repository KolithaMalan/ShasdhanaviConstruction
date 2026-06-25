import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { roleToDashboard } from "@/config/roles";

import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { HeroSection } from "@/components/welcome/HeroSection";
import { HowItWorks } from "@/components/welcome/HowItWorks";
import { SafetyInstructions } from "@/components/welcome/SafetyInstructions";
import { CompanyInfo } from "@/components/welcome/CompanyInfo";

export default async function WelcomePage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(roleToDashboard[session.user.role]);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo size="md" />
          <nav className="flex items-center gap-2">
            <Link
              href="#safety"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground sm:inline-flex"
            >
              Safety
            </Link>
            <Link
              href="#login"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground sm:inline-flex"
            >
              Login
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main>
        <HeroSection />
        <HowItWorks />
        <SafetyInstructions />
      </main>

      <CompanyInfo />
    </div>
  );
}
