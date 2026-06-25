export const siteConfig = {
  name: "Shasdhanavi Construction Security System",
  shortName: "Shasdhanavi SCS",
  company: "Shasdhanavi Construction (Pvt) Ltd",
  tagline:
    "Smart, integrated security for one of the country's largest power plant construction projects.",
  description:
    "Enterprise-grade access control, HSEQ compliance and incident management for the Shasdhanavi power plant construction site.",
  copyright: `© ${new Date().getFullYear()} Shasdhanavi Construction. All rights reserved.`,
  contact: {
    address: "Shasdhanavi Power Plant Construction Site, Sri Lanka",
    email: "info@shasdhanavi.lk",
    phone: "+94 11 000 0000",
  },
  links: {
    safety: "/#safety",
    contractor: "/login?intent=contractor",
  },
} as const;

export type SiteConfig = typeof siteConfig;
