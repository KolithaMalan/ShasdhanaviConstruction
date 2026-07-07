import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { roleToDashboard } from "@/config/roles";
import { siteConfig } from "@/config/site";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.searchName,
        legalName: siteConfig.company,
        url: siteConfig.url,
        logo: `${siteConfig.url}/Sahas.png`,
        description: siteConfig.seoDescription,
        email: siteConfig.contact.email,
        telephone: siteConfig.contact.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.address,
          addressCountry: "LK",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.searchName,
        description: siteConfig.seoDescription,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
