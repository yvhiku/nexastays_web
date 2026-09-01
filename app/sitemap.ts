import type { MetadataRoute } from "next";
import { toPublicAbsoluteUrl } from "@/lib/env";
import { fetchSeoListingSitemapEntries, fetchSeoSitemapEntries } from "@/lib/seo/seo-api";

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

function languageAlternates(path: string) {
  const suffix = path.replace(/^\/(en|fr|ar)(?=\/|$)/, "");
  return Object.fromEntries(
    locales.map((locale) => [locale, toPublicAbsoluteUrl(`/${locale}${suffix}`)]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: toPublicAbsoluteUrl(`/${locale}${route}`),
      lastModified: now,
      changeFrequency:
        route === "" || route === "/listings" || route === "/stays" ? "daily" : "monthly",
      priority: route === "" ? 1 : route === "/listings" || route === "/stays" ? 0.9 : 0.6,
      alternates: {
        languages: languageAlternates(`/${locale}${route}`),
      },
    })),
  );

  const [seoEntries, listingEntries] = await Promise.all([
    fetchSeoSitemapEntries(),
    fetchSeoListingSitemapEntries(),
  ]);
  const dynamicEntries: MetadataRoute.Sitemap = [
    ...seoEntries,
    ...listingEntries,
  ].map((entry) => ({
    url: toPublicAbsoluteUrl(entry.path),
    lastModified: entry.lastmod ? new Date(entry.lastmod) : now,
    changeFrequency: "daily" as const,
    priority: entry.priority ?? 0.85,
    alternates: {
      languages: languageAlternates(entry.path),
    },
  }));

  const entries = [...staticEntries, ...dynamicEntries];
  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
