import type { Metadata } from "next";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { getPublicSiteUrl } from "@/lib/env";
import type { SeoLocale } from "./types";

const LOCALES: SeoLocale[] = ["en", "fr", "ar"];
const OPEN_GRAPH_LOCALES: Record<SeoLocale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_MA",
};

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
  const image = args.ogImage
    ? args.ogImage.startsWith("http")
      ? args.ogImage
      : `${siteUrl}${args.ogImage}`
    : `${siteUrl}${NEXA_STAYS_LOGO_SRC}`;

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
      locale: OPEN_GRAPH_LOCALES[args.locale],
      alternateLocale: LOCALES
        .filter((locale) => locale !== args.locale)
        .map((locale) => OPEN_GRAPH_LOCALES[locale]),
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: args.title,
      description: args.description,
      images: [image],
    },
  };
}
