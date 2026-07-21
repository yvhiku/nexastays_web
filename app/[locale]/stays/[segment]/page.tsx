import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import {
  SEO_AMENITY_SLUGS,
  SEO_PROPERTY_TYPE_SLUGS,
} from "@/lib/seo/types";
import { fetchSeoDestinations, fetchSeoPage, fetchSeoListings } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildSeoPageJsonLd } from "@/lib/seo/json-ld";
import { SeoLandingPageClient } from "@/components/seo/SeoLandingPage.client";

export const revalidate = 86400;

type Props = {
  params: { locale: string; segment: string };
};

export async function generateStaticParams() {
  const destinations = await fetchSeoDestinations();
  const locales: SeoLocale[] = ["en", "fr", "ar"];
  const cityParams = destinations.flatMap((d) =>
    locales.map((locale) => ({ locale, segment: d.slug })),
  );
  const typeParams = SEO_PROPERTY_TYPE_SLUGS.flatMap((segment) =>
    locales.map((locale) => ({ locale, segment })),
  );
  const amenityParams = SEO_AMENITY_SLUGS.flatMap((segment) =>
    locales.map((locale) => ({ locale, segment })),
  );
  return [...cityParams, ...typeParams, ...amenityParams];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoPage([params.segment], locale);
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

export default async function SeoSegmentPage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoPage([params.segment], locale);
  if (!page) notFound();

  const listings = await fetchSeoListings(page.exploreFilters);
  const jsonLd = buildSeoPageJsonLd(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      <SeoLandingPageClient page={page} listings={listings} />
    </>
  );
}
