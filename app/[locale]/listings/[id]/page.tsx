import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { fetchSeoListingPage } from "@/lib/seo/listing-api";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildListingJsonLd } from "@/lib/seo/json-ld";
import { ListingDetailPageClient } from "@/components/listing/ListingDetailPage.client";

export const revalidate = 3600;

type Props = {
  params: { locale: string; id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoListingPage(params.id, locale);
  if (!page) return { robots: { index: false, follow: false } };

  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.ogImageUrl,
    robots: page.robots,
  });
}

export default async function ListingDetailPage({ params }: Props) {
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await fetchSeoListingPage(params.id, locale);
  if (!page) notFound();

  const jsonLd = buildListingJsonLd(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}
      <ListingDetailPageClient />
    </>
  );
}
