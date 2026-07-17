import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/env";

const locales = ["en", "fr", "ar"] as const;
const routes = [
  "",
  "/listings",
  "/host",
  "/about",
  "/contact",
  "/fees",
  "/safety-transparency",
  "/terms",
  "/privacy",
  "/refund",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();
  const now = new Date();

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: now,
      changeFrequency: route === "" || route === "/listings" ? "daily" : "monthly",
      priority: route === "" ? 1 : route === "/listings" ? 0.9 : 0.6,
    })),
  );
}
