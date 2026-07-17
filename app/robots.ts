import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/en", "/fr", "/ar", "/en/listings", "/fr/listings", "/ar/listings"],
        disallow: [
          "/en/bookings",
          "/fr/bookings",
          "/ar/bookings",
          "/en/my-bookings",
          "/fr/my-bookings",
          "/ar/my-bookings",
          "/en/profile",
          "/fr/profile",
          "/ar/profile",
          "/en/host/dashboard",
          "/fr/host/dashboard",
          "/ar/host/dashboard",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
