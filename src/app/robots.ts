import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Served at /robots.txt. Public marketing pages are crawlable; the
 * authenticated app, API and internal routes are kept out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/super-admin/",
        "/admin/",
        "/medical/",
        "/hseq/",
        "/security/",
        "/internal-security/",
        "/contractor/",
        "/profile/",
        "/notifications/",
        "/permanent-movements/",
        "/verify-code/",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
