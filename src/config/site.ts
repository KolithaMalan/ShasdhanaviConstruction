export const siteConfig = {
  name: "Sahasdhanavi Construction Security System",
  shortName: "Sahasdhanavi SCS",
  company: "Sahasdhanavi Construction (Pvt) Ltd",
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
