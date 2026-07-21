import { getPublicSiteUrl } from "@/lib/env";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import type { SeoPagePayload } from "./types";

export function buildSeoPageJsonLd(page: SeoPagePayload): Record<string, unknown>[] {
  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}${page.canonical}`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nexa Stays",
    url: siteUrl,
    logo: `${siteUrl}${NEXA_STAYS_LOGO_SRC}`,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nexa Stays",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/${page.locale}/listings?city={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };

  const nodes: Record<string, unknown>[] = [organization, website, breadcrumb];

  if (page.destination) {
    const touristDestination: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      name: page.destination.name,
      url: pageUrl,
      containedInPlace: {
        "@type": "Country",
        name: "Morocco",
      },
    };
    if (page.destination.latitude != null && page.destination.longitude != null) {
      touristDestination.geo = {
        "@type": "GeoCoordinates",
        latitude: page.destination.latitude,
        longitude: page.destination.longitude,
      };
    }
    nodes.push(touristDestination);
  }

  const lodgingBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: page.h1,
    url: pageUrl,
    description: page.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "MA",
      ...(page.destination?.name ? { addressLocality: page.destination.name } : {}),
    },
  };
  if (page.intelligence.avgRating != null) {
    lodgingBusiness.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: page.intelligence.avgRating,
      reviewCount: page.intelligence.reviewCount,
      bestRating: 5,
    };
  }
  nodes.push(lodgingBusiness);

  if (page.intelligence.listingCount > 0 && page.intelligence.minPrice != null) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "AggregateOffer",
      offerCount: page.intelligence.listingCount,
      lowPrice: page.intelligence.minPrice,
      highPrice: page.intelligence.maxPrice ?? page.intelligence.minPrice,
      priceCurrency: page.intelligence.currency,
      url: pageUrl,
    });
  }

  if (page.faq.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return nodes;
}

/** @deprecated use buildSeoPageJsonLd */
export function buildCityPageJsonLd(page: SeoPagePayload): Record<string, unknown>[] {
  return buildSeoPageJsonLd(page);
}
