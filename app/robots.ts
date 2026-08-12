import type { MetadataRoute } from "next";
import { getPublicSiteUrl, toPublicAbsoluteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl();
  const privateSegments = [
    "bookings",
    "my-bookings",
    "profile",
    "inbox",
    "login",
    "registration",
    "saved-listings",
    "host/dashboard",
    "host/listings",
  ];
  const localizedPrivatePaths = ["en", "fr", "ar"].flatMap((locale) =>
    privateSegments.map((segment) => `/${locale}/${segment}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", ...localizedPrivatePaths],
      },
    ],
    sitemap: toPublicAbsoluteUrl("/sitemap.xml"),
    host: baseUrl,
  };
}
