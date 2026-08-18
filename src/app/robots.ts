import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/ar/admin", "/en/admin"] },
    sitemap: `${siteConfig.siteUrl}/sitemap.xml`,
  };
}
