import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/config/site";

export function CompanyInfo() {
  return (
    <footer className="relative border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Logo size="md" />
            <p className="max-w-sm text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Contact
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[--color-brand-orange]" />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-[--color-brand-orange]" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-foreground"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-[--color-brand-orange]" />
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`}
                  className="hover:text-foreground"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Quick links
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="#login"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Personnel Login
                </Link>
              </li>
              <li>
                <Link
                  href={siteConfig.links.contractor}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contractor Registration Request
                </Link>
              </li>
              <li>
                <Link
                  href={siteConfig.links.safety}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Site Safety Rules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>{siteConfig.copyright}</p>
          <p className="font-mono">
            v1.0.0 · Phase 1 Build
          </p>
        </div>
      </div>
    </footer>
  );
}
