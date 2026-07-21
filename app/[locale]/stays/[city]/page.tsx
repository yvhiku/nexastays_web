import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { fetchSeoCityPage, fetchSeoDestinations, fetchCityListings } from "@/lib/seo/seo-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildCityPageJsonLd } from "@/lib/seo/json-ld";
import { SeoCityPageClient } from "@/components/seo/SeoCityPage.client";

export const revalidate = 86400;

type Props = {
  params: { locale: string; city: string };
};

export async function generateStaticParams() {
  const destinations = await fetchSeoDestinations();
  const locales: SeoLocale[] = ["en", "fr", "ar"];
  return destinations.flatMap((d) =>
    locales.map((locale) => ({ locale, city: d.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoCityPage(params.city, locale);
  if (!page) return {};
  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.destination.heroImageUrl,
    robots: page.robots,
  });
}

export default async function SeoCityPage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoCityPage(params.city, locale);
  if (!page) notFound();

  const listings = await fetchCityListings(page.destination.searchCity);
  const jsonLd = buildCityPageJsonLd(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      <SeoCityPageClient page={page} listings={listings} />
    </>
  );
}
