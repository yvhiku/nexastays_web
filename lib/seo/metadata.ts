import type { Metadata } from "next";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { toPublicAbsoluteUrl } from "@/lib/env";
import type { SeoLocale } from "./types";

const LOCALES: SeoLocale[] = ["en", "fr", "ar"];
const OPEN_GRAPH_LOCALES: Record<SeoLocale, string> = {
  en: "en_US",
  fr: "fr_FR",
  ar: "ar_MA",
};

/** Pathname only — strip accidental query/fragment before canonical construction. */
function seoPathname(path: string): string {
  const trimmed = path.trim();
  const withoutQuery = trimmed.split(/[?#]/, 1)[0] ?? "";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

export function buildSeoMetadata(args: {
  title: string;
  description: string;
  path: string;
  locale: SeoLocale;
  ogImage?: string | null;
  robots?: string;
}): Metadata {
  const canonicalPath = seoPathname(args.path);
  const languages = Object.fromEntries(
    LOCALES.map((loc) => {
      const localized = canonicalPath.replace(/^\/(en|fr|ar)/, `/${loc}`);
      return [loc, toPublicAbsoluteUrl(localized)];
    }),
  );
  const canonical = toPublicAbsoluteUrl(canonicalPath);

  const indexable = !args.robots?.includes("noindex");
  const image = args.ogImage
    ? args.ogImage.startsWith("http")
      ? args.ogImage
      : toPublicAbsoluteUrl(args.ogImage)
    : toPublicAbsoluteUrl(NEXA_STAYS_LOGO_SRC);

  return {
    title: args.title,
    description: args.description,
    alternates: {
      canonical,
      languages: { ...languages, "x-default": languages.en ?? canonical },
    },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      url: toPublicAbsoluteUrl(canonicalPath),
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
