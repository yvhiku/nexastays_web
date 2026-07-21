import type { Metadata } from "next";
import { getPublicSiteUrl } from "@/lib/env";
import type { SeoLocale } from "./types";

const LOCALES: SeoLocale[] = ["en", "fr", "ar"];

export function buildSeoMetadata(args: {
  title: string;
  description: string;
  path: string;
  locale: SeoLocale;
  ogImage?: string | null;
  robots?: string;
}): Metadata {
  const siteUrl = getPublicSiteUrl();
  const canonicalPath = args.path.startsWith("/") ? args.path : `/${args.path}`;
  const languages = Object.fromEntries(
    LOCALES.map((loc) => {
      const localized = canonicalPath.replace(/^\/(en|fr|ar)/, `/${loc}`);
      return [loc, localized];
    }),
  );

  const indexable = !args.robots?.includes("noindex");

  return {
    title: args.title,
    description: args.description,
    alternates: {
      canonical: canonicalPath,
      languages: { ...languages, "x-default": languages.en ?? canonicalPath },
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: `${siteUrl}${canonicalPath}`,
      title: args.title,
      description: args.description,
      images: args.ogImage
        ? [{ url: args.ogImage.startsWith("http") ? args.ogImage : `${siteUrl}${args.ogImage}` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: args.description,
      images: args.ogImage
        ? [args.ogImage.startsWith("http") ? args.ogImage : `${siteUrl}${args.ogImage}`]
        : undefined,
    },
  };
}
