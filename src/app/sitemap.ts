import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Served at /sitemap.xml. Lists the publicly indexable pages so search
 * engines can discover them. The authenticated app is intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}/contractor-registration`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
