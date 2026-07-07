export const siteConfig = {
  name: "Sahasdhanavi Construction Security System",
  shortName: "Sahasdhanavi SCS",
  company: "Sahasdhanavi Construction (Pvt) Ltd",

  /* ── Public site URL + search-result branding ──────────────
     `url` must match the primary domain you set in Vercel. Keep it
     consistent with AUTH_URL. Change here to update SEO everywhere. */
  url: "https://sahasdhanavics.com",
  /** Brand name shown as the search-result title / og:site_name. */
  searchName: "SahasdhanaviCS",
  /** Meta description shown under the link in Google/Chrome results. */
  seoDescription:
    "SahasdhanaviCS - Sahasdhanavi Construction Security. Smart, integrated access control, HSEQ compliance and incident management. Sahasdhanavi Site.",
  /** Search keywords. */
  keywords: [
    "SahasdhanaviCS",
    "Sahasdhanavi Construction Security",
    "access control",
    "HSEQ compliance",
    "incident management",
    "Sahasdhanavi Site",
    "construction site security",
  ],

  tagline:
    "Smart, integrated security for one of the country's largest power plant construction projects.",
  description:
    "Enterprise-grade access control, HSEQ compliance and incident management for the Sahasdhanavi power plant construction site.",
  copyright: `© ${new Date().getFullYear()} Sahasdhanavi Construction. All rights reserved.`,
  contact: {
    address: "Sahasdhanavi Power Plant Construction Site, Sri Lanka",
    email: "sahasdhanavi.epc@gmail.com",
    phone: "+94 778561467",
  },
  links: {
    safety: "/#safety",
    contractor: "/login?intent=contractor",
  },
} as const;

export type SiteConfig = typeof siteConfig;
