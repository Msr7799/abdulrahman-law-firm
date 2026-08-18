import type { MetadataRoute } from "next";
import { locales, siteConfig } from "@/config/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/about",
    "/services",
    "/consultation",
    "/contact",
    "/location",
    "/faq",
    "/privacy",
    "/legal-disclaimer",
  ];
  return locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${siteConfig.siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : path === "/consultation" ? 0.9 : 0.7,
      alternates: {
        languages: {
          ar: `${siteConfig.siteUrl}/ar${path}`,
          en: `${siteConfig.siteUrl}/en${path}`,
        },
      },
    })),
  );
}
