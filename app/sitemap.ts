import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/env";
import { fetchSeoSitemapEntries } from "@/lib/seo/seo-api";

const locales = ["en", "fr", "ar"] as const;
const staticRoutes = [
  "",
  "/listings",
  "/stays",
  "/guides",
  "/host",
  "/about",
  "/contact",
  "/fees",
  "/safety-transparency",
  "/terms",
  "/privacy",
  "/refund",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: now,
      changeFrequency: route === "" || route === "/listings" || route === "/stays" ? "daily" : "monthly",
      priority: route === "" ? 1 : route === "/listings" || route === "/stays" ? 0.9 : 0.6,
    })),
  );

  const seoEntries = await fetchSeoSitemapEntries();
  const dynamicEntries: MetadataRoute.Sitemap = seoEntries.map((entry) => ({
    url: `${baseUrl}${entry.path}`,
    lastModified: entry.lastmod ? new Date(entry.lastmod) : now,
    changeFrequency: "daily",
    priority: entry.priority ?? 0.85,
  }));

  return [...staticEntries, ...dynamicEntries];
}
