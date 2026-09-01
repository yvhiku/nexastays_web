import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { fetchSeoPage, fetchSeoListings } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildSeoPageJsonLd } from "@/lib/seo/json-ld";
import { localizeSeoPagePayload } from "@/lib/seo/locale-seo-copy";
import { enrichSeoPageWithRelatedGuides } from "@/lib/seo/enrich-related-guides";
import { SeoLandingPageClient } from "@/components/seo/SeoLandingPage.client";
import { serializeJsonLd } from "@/lib/seo/safe-json-ld";

// This route reads request-aware locale state and live catalog data. Keeping it
// runtime SSR avoids a build-time API dependency and static fallback crashes.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; segment: string; combo: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const raw = await fetchSeoPage([params.segment, params.combo], locale);
  if (!raw) return {};
  const page = localizeSeoPagePayload(await enrichSeoPageWithRelatedGuides(raw));
  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.destination?.heroImageUrl ?? undefined,
    robots: page.robots,
  });
}

export default async function SeoComboPage(props: Props) {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const raw = await fetchSeoPage([params.segment, params.combo], locale);
  if (!raw) notFound();
  const page = localizeSeoPagePayload(await enrichSeoPageWithRelatedGuides(raw));

  const listings = await fetchSeoListings(page.exploreFilters);
  const jsonLd = buildSeoPageJsonLd(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
      <SeoLandingPageClient page={page} listings={listings} />
    </>
  );
}
