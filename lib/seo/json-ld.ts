import { getPublicSiteUrl } from "@/lib/env";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import type { SeoPagePayload } from "./types";

export function buildCityPageJsonLd(page: SeoPagePayload): Record<string, unknown>[] {
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

  const faq =
    page.faq.length > 0
      ? {
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
        }
      : null;

  return [organization, website, breadcrumb, touristDestination, ...(faq ? [faq] : [])];
}
