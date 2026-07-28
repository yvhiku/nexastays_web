import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveGuideEntityGraph,
  deriveListingEntityGraph,
  deriveSeoPageEntityGraph,
  relatedEntities,
  semanticBreadcrumbsForGuide,
  semanticBreadcrumbsForListing,
  semanticBreadcrumbsForSeoPage,
  validateEntityGraph,
  type TravelEntityGraph,
} from "../seo/entity-graph";
import {
  buildListingJsonLd,
  buildSeoGuideJsonLd,
  buildSeoPageJsonLd,
} from "../seo/json-ld";
import type {
  SeoGuidePagePayload,
  SeoListingPagePayload,
  SeoPagePayload,
} from "../seo/types";

const page: SeoPagePayload = {
  pageType: "city_neighborhood",
  locale: "en",
  path: "/en/stays/casablanca/maarif",
  canonical: "/en/stays/casablanca/maarif",
  title: "Stays in Maarif",
  description: "Verified stays in Maarif, Casablanca.",
  h1: "Stays in Maarif",
  hreflang: {},
  robots: "index,follow",
  destination: {
    id: "casablanca",
    slug: "casablanca",
    name: "Casablanca",
    countryCode: "MA",
    regionId: null,
    latitude: 33.57,
    longitude: -7.59,
    heroImageUrl: null,
    bestTimeToVisit: null,
    nearbyCitySlugs: [],
    searchCity: "Casablanca",
    indexable: true,
    seoScore: 90,
    listingCountCache: 10,
  },
  neighborhood: { slug: "maarif", name: "Maarif", searchTerm: "Maarif" },
  landmark: null,
  filterLabel: null,
  exploreFilters: { city: "Casablanca", neighborhood: "Maarif" },
  intelligence: {
    listingCount: 10,
    verifiedCount: 8,
    avgNightlyPrice: 900,
    minPrice: 600,
    maxPrice: 1400,
    luxuryCount: 2,
    avgRating: 4.7,
    reviewCount: 30,
    topNeighborhood: "Maarif",
    bestMonth: null,
    topAmenities: ["wifi"],
    topPropertyType: "apartment",
    verifiedPercent: 80,
    currency: "MAD",
  },
  geoBlocks: [],
  faq: [],
  aiSnippets: [],
  nearbyDestinations: [
    {
      id: "rabat",
      slug: "rabat",
      name: "Rabat",
      countryCode: "MA",
      regionId: null,
      latitude: 34.02,
      longitude: -6.84,
      heroImageUrl: null,
      bestTimeToVisit: null,
      nearbyCitySlugs: [],
      searchCity: "Rabat",
      indexable: true,
      seoScore: 80,
      listingCountCache: 5,
    },
  ],
  relatedDestinations: [],
  propertyTypeLinks: [
    {
      slug: "apartments",
      label: "Apartments",
      href: "/en/stays/casablanca/apartments",
    },
  ],
  amenityLinks: [
    { slug: "wifi", label: "Wi-Fi", href: "/en/stays/casablanca/wifi" },
  ],
  neighborhoodLinks: [],
  breadcrumbs: [],
  contentBlocks: {
    nearby_poi: [
      {
        name: "Twin Center",
        href: "/en/stays/near-twin-center",
        description: "A verified editorial point of interest.",
      },
    ],
  },
  cityGuideLink: {
    slug: "casablanca-travel-guide",
    href: "/en/guides/casablanca-travel-guide",
    label: "Casablanca travel guide",
  },
  relatedGuides: [],
  indexable: true,
  seoScore: 90,
  lastmod: "2026-07-28T00:00:00.000Z",
  registrySlug: "casablanca-maarif",
};

const guide: SeoGuidePagePayload = {
  pageType: "guide",
  locale: "fr",
  slug: "casablanca-travel-guide",
  guideType: "travel",
  path: "/fr/guides/casablanca-travel-guide",
  canonical: "/fr/guides/casablanca-travel-guide",
  title: "Guide de Casablanca",
  description: "Guide vérifié de Casablanca.",
  h1: "Guide de Casablanca",
  hreflang: {},
  robots: "index,follow",
  bodyHtml: "<p>Guide</p>",
  geoBlocks: [],
  destination: { ...page.destination!, name: "Casablanca" },
  intelligence: page.intelligence,
  relatedGuides: [
    {
      slug: "casablanca-things-to-do",
      guideType: "experience",
      title: "Que faire à Casablanca",
      description: "Activités vérifiées.",
      destinationSlug: "casablanca",
      destinationName: "Casablanca",
      href: "/fr/guides/casablanca-things-to-do",
      seoScore: 80,
    },
  ],
  cityGuideLink: null,
  exploreFilters: { city: "Casablanca" },
  breadcrumbs: [],
  indexable: true,
  seoScore: 90,
  lastmod: "2026-07-28T00:00:00.000Z",
};

const listing: SeoListingPagePayload = {
  pageType: "listing",
  locale: "ar",
  listingId: "listing-1",
  path: "/ar/listings/listing-1",
  canonical: "/ar/listings/listing-1",
  title: "شقة في المعاريف",
  description: "إقامة موثقة في المعاريف.",
  h1: "شقة في المعاريف",
  hreflang: {},
  robots: "index,follow",
  ogImageUrl: null,
  listingType: "APARTMENT",
  city: "Casablanca",
  neighborhood: "Maarif",
  basePrice: 900,
  currency: "MAD",
  avgRating: 4.8,
  reviewCount: 12,
  hasWalkthrough: true,
  geoLat: 33.57,
  geoLng: -7.59,
  breadcrumbs: [],
  indexable: true,
  seoScore: 95,
  lastmod: "2026-07-28T00:00:00.000Z",
};

test("SEO pages resolve only explicit registry, editorial, and marketplace relationships", () => {
  const graph = deriveSeoPageEntityGraph(page, [
    {
      id: "listing-1",
      title: "Maarif apartment",
      listing_type: "APARTMENT",
      city: "Casablanca",
      neighborhood: "Maarif",
      status: "ACTIVE",
      checkin_time: "15:00",
      checkout_time: "11:00",
      instant_booking: false,
    },
  ]);
  assert.deepEqual(validateEntityGraph(graph), []);
  assert.equal(graph.rootId, "neighborhood:casablanca:maarif");
  assert.ok(graph.relationships.some((item) => item.type === "near"));
  assert.ok(graph.relationships.some((item) => item.type === "featured_in"));
  assert.ok(relatedEntities(graph).some(({ entity }) => entity.kind === "listing"));
  assert.ok(!graph.entities.some((entity) => entity.kind === "airport"));
});

test("semantic page breadcrumbs follow Morocco, city, and neighborhood hierarchy", () => {
  assert.deepEqual(semanticBreadcrumbsForSeoPage(page), [
    { name: "Morocco", path: "/en/stays" },
    { name: "Casablanca", path: "/en/stays/casablanca" },
    { name: "Maarif", path: "/en/stays/casablanca/maarif" },
  ]);
});

test("guide graph and breadcrumbs preserve the requested locale", () => {
  const graph = deriveGuideEntityGraph(guide);
  assert.deepEqual(validateEntityGraph(graph), []);
  assert.ok(graph.entities.every((entity) => entity.href.startsWith("/fr/")));
  assert.deepEqual(semanticBreadcrumbsForGuide(guide).map((crumb) => crumb.path), [
    "/fr/stays",
    "/fr/guides",
    "/fr/stays/casablanca",
    "/fr/guides/casablanca-travel-guide",
  ]);
});

test("listing graph uses known plural property routes and Arabic hierarchy", () => {
  const graph = deriveListingEntityGraph(listing);
  assert.deepEqual(validateEntityGraph(graph), []);
  assert.ok(
    graph.entities.some(
      (entity) =>
        entity.kind === "property_type" &&
        entity.href === "/ar/stays/casablanca/apartments",
    ),
  );
  assert.equal(semanticBreadcrumbsForListing(listing)[0]?.name, "المغرب");
});

test("structured-data breadcrumbs mirror semantic visible breadcrumbs", () => {
  const cases = [
    [buildSeoPageJsonLd(page), semanticBreadcrumbsForSeoPage(page)],
    [buildSeoGuideJsonLd(guide), semanticBreadcrumbsForGuide(guide)],
    [buildListingJsonLd(listing), semanticBreadcrumbsForListing(listing)],
  ] as const;
  for (const [nodes, breadcrumbs] of cases) {
    const node = nodes.find((item) => item["@type"] === "BreadcrumbList");
    assert.ok(node);
    assert.deepEqual(
      (node.itemListElement as Array<{ name: string }>).map((item) => item.name),
      breadcrumbs.map((item) => item.name),
    );
  }
});

test("structured data references the same verified related entities as the visible graph", () => {
  const collection = buildSeoPageJsonLd(page).find(
    (item) => item["@type"] === "CollectionPage",
  );
  const article = buildSeoGuideJsonLd(guide).find((item) => item["@type"] === "Article");
  const lodging = buildListingJsonLd(listing).find(
    (item) => item["@type"] === "LodgingBusiness",
  );
  assert.ok(Array.isArray(collection?.mentions));
  assert.ok(Array.isArray(article?.mentions));
  assert.ok(Array.isArray(lodging?.mentions));
  assert.ok(
    (collection?.mentions as Array<{ url: string }>).some((item) =>
      item.url.endsWith("/en/guides/casablanca-travel-guide"),
    ),
  );
  assert.ok(
    (lodging?.mentions as Array<{ url: string }>).some((item) =>
      item.url.endsWith("/ar/stays/casablanca/apartments"),
    ),
  );
});

test("entity validator rejects dangling relationships and parent cycles", () => {
  const invalid: TravelEntityGraph = {
    locale: "en",
    rootId: "city:a",
    entities: [
      {
        id: "city:a",
        kind: "city",
        slug: "a",
        locale: "en",
        name: "A",
        href: "/en/stays/a",
        parentId: "city:b",
        source: "registry",
        lastUpdated: "2026-07-28",
      },
      {
        id: "city:b",
        kind: "city",
        slug: "b",
        locale: "en",
        name: "B",
        href: "/en/stays/b",
        parentId: "city:a",
        source: "registry",
        lastUpdated: "2026-07-28",
      },
    ],
    relationships: [
      {
        id: "near:city:a:missing",
        type: "near",
        fromId: "city:a",
        toId: "missing",
        source: "registry",
      },
    ],
  };
  const codes = validateEntityGraph(invalid).map((issue) => issue.code);
  assert.ok(codes.includes("dangling_relationship"));
  assert.ok(codes.includes("parent_cycle"));
});
