import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { fetchSeoGuidePage, fetchSeoGuides } from "@/lib/seo/guide-api";
import { fetchSeoListings } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildSeoGuideJsonLd } from "@/lib/seo/json-ld";
import { SeoGuidePageClient } from "@/components/seo/SeoGuidePage.client";

export const revalidate = 86400;

type Props = {
  params: { locale: string; slug: string };
};

export async function generateStaticParams() {
  const locales: SeoLocale[] = ["en", "fr", "ar"];
  const enGuides = await fetchSeoGuides("en");
  return enGuides.flatMap((guide) =>
    locales.map((locale) => ({ locale, slug: guide.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoGuidePage(params.slug, locale);
  if (!page) return {};
  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.destination?.heroImageUrl ?? undefined,
    robots: page.robots,
  });
}

export default async function GuidePage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoGuidePage(params.slug, locale);
  if (!page) notFound();

  const listings =
    page.exploreFilters && Object.keys(page.exploreFilters).length > 0
      ? await fetchSeoListings(page.exploreFilters)
      : [];

  const jsonLd = buildSeoGuideJsonLd(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      <SeoGuidePageClient page={page} listings={listings} />
    </>
  );
}
