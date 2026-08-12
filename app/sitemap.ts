import type { MetadataRoute } from "next";
import { toPublicAbsoluteUrl } from "@/lib/env";
import {
  fetchSeoListingSitemapEntries,
  fetchSeoSitemapEntries,
} from "@/lib/seo/seo-api";
import { isNonEnglishGuideArticlePath } from "@/lib/seo/locale-seo-copy";
import { isEnglishGuideArticlePath } from "@/lib/seo/guide-links";

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
  // Phase 4/5: EN guide articles are the only indexable guide locales.
  if (isEnglishGuideArticlePath(path)) {
    const en = toPublicAbsoluteUrl(path.replace(/\/$/, "") || path);
    return { en, "x-default": en };
  }
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
  // FR/AR guide articles are English clones — exclude from sitemap (hubs stay).
  const filteredSeoEntries = seoEntries.filter(
    (entry) => !isNonEnglishGuideArticlePath(entry.path),
  );
  const dynamicEntries: MetadataRoute.Sitemap = [
    ...filteredSeoEntries,
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
