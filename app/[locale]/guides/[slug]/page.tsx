import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { fetchSeoGuidePage, fetchSeoGuides } from "@/lib/seo/guide-api";
import { fetchSeoListings } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildSeoGuideJsonLd } from "@/lib/seo/json-ld";
import { applyGuideLocaleIndexPolicy } from "@/lib/seo/locale-seo-copy";
import { SeoGuidePageClient } from "@/components/seo/SeoGuidePage.client";
import { staticParamsInDev } from "@/lib/seo/dev-static-params";
import { serializeJsonLd } from "@/lib/seo/safe-json-ld";
import { sanitizeContentHtml } from "@/lib/seo/sanitize-content-html";

export const revalidate = 86400;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const locales: SeoLocale[] = ["en", "fr", "ar"];
  const enGuides = await fetchSeoGuides("en");
  return staticParamsInDev(
    enGuides.flatMap((guide) =>
      locales.map((locale) => ({ locale, slug: guide.slug })),
    ),
  );
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const raw = await fetchSeoGuidePage(params.slug, locale);
  if (!raw) return {};
  const page = applyGuideLocaleIndexPolicy(raw);
  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.destination?.heroImageUrl ?? undefined,
    robots: page.robots,
    // Only EN guide articles are treated as localized/indexable content.
    hreflangLocales: ["en"],
  });
}

export default async function GuidePage(props: Props) {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const raw = await fetchSeoGuidePage(params.slug, locale);
  if (!raw) notFound();
  const page = applyGuideLocaleIndexPolicy(raw);

  const listings =
    page.exploreFilters && Object.keys(page.exploreFilters).length > 0
      ? await fetchSeoListings(page.exploreFilters)
      : [];

  const jsonLd = buildSeoGuideJsonLd(page);
  const safePage = {
    ...page,
    bodyHtml: sanitizeContentHtml(page.bodyHtml),
  };

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
      <SeoGuidePageClient page={safePage} listings={listings} />
    </>
  );
}
