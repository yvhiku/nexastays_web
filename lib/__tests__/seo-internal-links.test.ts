import assert from "node:assert/strict";
import test from "node:test";
import {
  indexableGuideArticlePath,
  isEnglishGuideArticlePath,
  isIndexableGuideArticleHref,
  seoLinkHrefForLocalePath,
  toClientSeoHref,
} from "../seo/guide-links";
import { enrichSeoPageWithRelatedGuides } from "../seo/enrich-related-guides";
import type { SeoGuideSummaryDto, SeoPagePayload } from "../seo/types";

test("indexableGuideArticlePath always targets /en/guides/{slug}", () => {
  assert.equal(
    indexableGuideArticlePath("morocco-travel-guide"),
    "/en/guides/morocco-travel-guide",
  );
  assert.equal(
    indexableGuideArticlePath("/fr/guides/casablanca-travel-guide"),
    "/en/guides/casablanca-travel-guide",
  );
  assert.equal(
    indexableGuideArticlePath("en/guides/foo"),
    "/en/guides/foo",
  );
  assert.equal(isIndexableGuideArticleHref("/en/guides/foo"), true);
  assert.equal(isIndexableGuideArticleHref("/fr/guides/foo"), false);
  assert.equal(isEnglishGuideArticlePath("/en/guides/foo"), true);
  assert.equal(isEnglishGuideArticlePath("/fr/guides"), false);
});

test("toClientSeoHref preserves EN guide articles across locales", () => {
  const frPath = (p: string) => `/fr${p.startsWith("/") ? p : `/${p}`}`;
  assert.equal(
    toClientSeoHref("/en/guides/morocco-travel-guide", frPath),
    "/en/guides/morocco-travel-guide",
  );
  assert.equal(
    toClientSeoHref("/fr/stays/casablanca", frPath),
    "/fr/stays/casablanca",
  );
  assert.deepEqual(seoLinkHrefForLocalePath("/en/guides/x"), {
    href: "/en/guides/x",
    preserveAbsolute: true,
  });
});

test("enrichSeoPageWithRelatedGuides maps destination guides to EN hrefs", async () => {
  const previousFetch = globalThis.fetch;
  const guides: SeoGuideSummaryDto[] = [
    {
      slug: "casablanca-travel-guide",
      guideType: "travel",
      title: "Casablanca Travel Guide",
      description: "Guide",
      destinationSlug: "casablanca",
      destinationName: "Casablanca",
      href: "/fr/guides/casablanca-travel-guide",
      seoScore: 80,
    },
    {
      slug: "marrakech-travel-guide",
      guideType: "travel",
      title: "Marrakech Travel Guide",
      description: "Guide",
      destinationSlug: "marrakech",
      destinationName: "Marrakech",
      href: "/en/guides/marrakech-travel-guide",
      seoScore: 80,
    },
  ];

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/stays/seo/guides?") && url.includes("locale=en")) {
      return new Response(JSON.stringify(guides), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;

  const previousBase = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = "http://stays.test/api/v1";

  try {
    const page = {
      pageType: "city",
      locale: "fr",
      path: "/fr/stays/casablanca",
      title: "x",
      description: "y",
      h1: "z",
      canonical: "/fr/stays/casablanca",
      hreflang: {},
      robots: "index,follow",
      destination: {
        id: "1",
        slug: "casablanca",
        name: "Casablanca",
        countryCode: "MA",
        regionId: null,
        latitude: null,
        longitude: null,
        heroImageUrl: null,
        bestTimeToVisit: null,
        nearbyCitySlugs: [],
        searchCity: "Casablanca",
        indexable: true,
        seoScore: 80,
        listingCountCache: 1,
      },
      neighborhood: null,
      landmark: null,
      filterLabel: null,
      exploreFilters: {},
      intelligence: {
        listingCount: 0,
        verifiedCount: 0,
        avgNightlyPrice: null,
        minPrice: null,
        maxPrice: null,
        luxuryCount: 0,
        avgRating: null,
        reviewCount: 0,
        topNeighborhood: null,
        bestMonth: null,
        topAmenities: [],
        topPropertyType: null,
        verifiedPercent: null,
        currency: "MAD",
      },
      geoBlocks: [],
      faq: [],
      aiSnippets: [],
      nearbyDestinations: [],
      relatedDestinations: [],
      propertyTypeLinks: [],
      amenityLinks: [],
      neighborhoodLinks: [],
      breadcrumbs: [],
      relatedGuides: [],
      cityGuideLink: null,
      indexable: true,
      seoScore: 80,
      lastmod: "2026-01-01T00:00:00.000Z",
      registrySlug: "casablanca",
    } as SeoPagePayload;

    const enriched = await enrichSeoPageWithRelatedGuides(page);
    assert.ok(enriched.relatedGuides && enriched.relatedGuides.length === 1);
    assert.equal(
      enriched.relatedGuides![0]!.href,
      "/en/guides/casablanca-travel-guide",
    );
    assert.ok(enriched.cityGuideLink);
    assert.equal(
      enriched.cityGuideLink!.href,
      "/en/guides/casablanca-travel-guide",
    );
    assert.ok(!enriched.relatedGuides![0]!.href.startsWith("/fr/"));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) {
      delete process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = previousBase;
    }
  }
});

test("locale stays paths keep locale prefix shape", () => {
  const frPath = (p: string) => {
    const clean = p.startsWith("/") ? p : `/${p}`;
    return `/fr${clean}`;
  };
  assert.equal(toClientSeoHref("/fr/stays/casablanca/apartments", frPath), "/fr/stays/casablanca/apartments");
  assert.equal(toClientSeoHref("/en/stays/marrakech", frPath), "/fr/stays/marrakech");
});
