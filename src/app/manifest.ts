import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Served at /manifest.webmanifest and auto-linked by Next.js. Controls how the
 * site looks when installed to a phone home screen / shown as an app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.searchName} — ${siteConfig.company}`,
    short_name: siteConfig.searchName,
    description: siteConfig.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#146C94",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/Sahas.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
