import { getPublicSiteUrl } from "@/lib/env";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import {
  deriveGuideEntityGraph,
  deriveListingEntityGraph,
  deriveSeoPageEntityGraph,
  relatedEntities,
  semanticBreadcrumbsForGuide,
  semanticBreadcrumbsForListing,
  semanticBreadcrumbsForSeoPage,
  type SemanticBreadcrumb,
  type TravelEntity,
} from "./entity-graph";
import type { SeoGuidePagePayload, SeoListingPagePayload, SeoPagePayload } from "./types";

function breadcrumbJsonLd(
  breadcrumbs: SemanticBreadcrumb[],
  siteUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };
}

function schemaReference(entity: TravelEntity, siteUrl: string): Record<string, unknown> {
  const type =
    entity.kind === "city"
      ? "City"
      : entity.kind === "country"
        ? "Country"
        : entity.kind === "landmark" || entity.kind === "attraction"
          ? "TouristAttraction"
          : entity.kind === "guide"
            ? "Article"
            : entity.kind === "listing"
              ? "LodgingBusiness"
              : entity.kind === "property_type" || entity.kind === "amenity"
                ? "DefinedTerm"
                : "Place";
  return {
    "@type": type,
    name: entity.name,
    url: entity.href.startsWith("http") ? entity.href : `${siteUrl}${entity.href}`,
  };
}

export function buildSeoPageJsonLd(page: SeoPagePayload): Record<string, unknown>[] {
  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}${page.canonical}`;
  const graph = deriveSeoPageEntityGraph(page);

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

  const breadcrumb = breadcrumbJsonLd(semanticBreadcrumbsForSeoPage(page), siteUrl);

  const nodes: Record<string, unknown>[] = [organization, website, breadcrumb];

  if (page.landmark) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: page.landmark.name,
      url: pageUrl,
      geo: {
        "@type": "GeoCoordinates",
        latitude: page.landmark.latitude,
        longitude: page.landmark.longitude,
      },
      containedInPlace: {
        "@type": "City",
        name: page.landmark.searchCity,
      },
    });
  }

  if (page.neighborhood && page.destination) {
    const place: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Place",
      name: page.neighborhood.name,
      url: pageUrl,
      containedInPlace: {
        "@type": "City",
        name: page.destination.name,
      },
    };
    const qf = page.contentBlocks?.quick_facts;
    if (qf?.atmosphere) place.description = qf.atmosphere;
    if (qf?.budget) place.additionalProperty = { "@type": "PropertyValue", name: "budget", value: qf.budget };
    nodes.push(place);
  } else if (page.destination) {
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

  const collectionPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.h1,
    url: pageUrl,
    description: page.description,
    inLanguage: page.locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: page.intelligence.listingCount,
    },
  };
  const graphReferences = relatedEntities(graph).map(({ entity }) =>
    schemaReference(entity, siteUrl),
  );
  if (graphReferences.length > 0) collectionPage.mentions = graphReferences;
  nodes.push(collectionPage);

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

export function buildSeoGuideJsonLd(page: SeoGuidePagePayload): Record<string, unknown>[] {
  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}${page.canonical}`;
  const graph = deriveGuideEntityGraph(page);

  const breadcrumb = breadcrumbJsonLd(semanticBreadcrumbsForGuide(page), siteUrl);

  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1,
    description: page.description,
    url: pageUrl,
    dateModified: page.lastmod,
    publisher: {
      "@type": "Organization",
      name: "Nexa Stays",
      url: siteUrl,
      logo: `${siteUrl}${NEXA_STAYS_LOGO_SRC}`,
    },
    inLanguage: page.locale,
  };

  if (page.destination) {
    article.about = {
      "@type": "City",
      name: page.destination.name,
      containedInPlace: { "@type": "Country", name: "Morocco" },
    };
  }
  const graphReferences = relatedEntities(graph)
    .map(({ entity }) => schemaReference(entity, siteUrl))
    .filter((entity) => entity.url !== pageUrl);
  if (graphReferences.length > 0) article.mentions = graphReferences;

  const nodes: Record<string, unknown>[] = [breadcrumb, article];

  if (page.geoBlocks.length > 0) {
    nodes.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.geoBlocks.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return nodes;
}

export function buildListingJsonLd(page: SeoListingPagePayload): Record<string, unknown>[] {
  const siteUrl = getPublicSiteUrl();
  const pageUrl = `${siteUrl}${page.canonical}`;
  const graph = deriveListingEntityGraph(page);

  const breadcrumb = breadcrumbJsonLd(semanticBreadcrumbsForListing(page), siteUrl);

  const lodging: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: page.h1,
    description: page.description,
    url: pageUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: page.city,
      addressCountry: "MA",
      ...(page.neighborhood ? { streetAddress: page.neighborhood } : {}),
    },
  };

  if (page.geoLat != null && page.geoLng != null) {
    lodging.geo = {
      "@type": "GeoCoordinates",
      latitude: page.geoLat,
      longitude: page.geoLng,
    };
  }

  if (page.ogImageUrl) {
    lodging.image = page.ogImageUrl;
  }

  if (page.avgRating != null && page.reviewCount > 0) {
    lodging.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: page.avgRating,
      reviewCount: page.reviewCount,
      bestRating: 5,
    };
  }

  if (page.basePrice != null) {
    lodging.offers = {
      "@type": "Offer",
      price: page.basePrice,
      priceCurrency: page.currency,
      availability: "https://schema.org/InStock",
      url: pageUrl,
    };
  }
  const graphReferences = relatedEntities(graph)
    .map(({ entity }) => schemaReference(entity, siteUrl))
    .filter((entity) => entity.url !== pageUrl);
  if (graphReferences.length > 0) lodging.mentions = graphReferences;

  return [breadcrumb, lodging];
}

/** @deprecated use buildSeoPageJsonLd */
export function buildCityPageJsonLd(page: SeoPagePayload): Record<string, unknown>[] {
  return buildSeoPageJsonLd(page);
}
