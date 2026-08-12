import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server";
import type { SeoLocale } from "@/lib/seo/types";
import { resolveListingDetailPage } from "@/lib/seo/listing-detail-access";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { buildListingJsonLd } from "@/lib/seo/json-ld";
import { ListingDetailPageClient } from "@/components/listing/ListingDetailPage.client";
import { serializeJsonLd } from "@/lib/seo/safe-json-ld";
import {
  deriveListingEntityGraph,
  semanticBreadcrumbsForListing,
} from "@/lib/seo/entity-graph";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await resolveListingDetailPage(params.id, locale);
  if (!page) notFound();

  return buildSeoMetadata({
    title: page.title,
    description: page.description,
    path: page.canonical,
    locale,
    ogImage: page.ogImageUrl,
    robots: page.robots,
  });
}

export default async function ListingDetailPage(props: Props) {
  const params = await props.params;
  const locale = getServerLocale(params.locale) as SeoLocale;
  const page = await resolveListingDetailPage(params.id, locale);
  if (!page) notFound();

  const jsonLd = buildListingJsonLd(page);
  const entityGraph = deriveListingEntityGraph(page);
  const breadcrumbs = semanticBreadcrumbsForListing(page);

  return (
    <>
      {jsonLd.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
      <ListingDetailPageClient seoGraph={entityGraph} seoBreadcrumbs={breadcrumbs} />
    </>
  );
}
