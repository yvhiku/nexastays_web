import assert from "node:assert/strict";
import test from "node:test";
import {
  applyGuideLocaleIndexPolicy,
  isNonEnglishGuideArticlePath,
  localizeSeoPagePayload,
  shouldNoindexUntranslatedNeighborhood,
} from "../seo/locale-seo-copy";
import { buildSeoMetadata } from "../seo/metadata";
import type {
  SeoGuidePagePayload,
  SeoLocale,
  SeoPagePayload,
} from "../seo/types";

function baseCityPage(locale: SeoLocale, city = "Casablanca"): SeoPagePayload {
  return {
    pageType: "city",
    locale,
    path: `/${locale}/stays/casablanca`,
    title: `Stays in ${city} | Hotels, Riads & Apartments | Nexa Stays`,
    description: `Discover hotels, riads, apartments and villas in ${city}. Compare verified listings and book securely with Nexa Stays.`,
    h1: `Stays in ${city}`,
    canonical: `/${locale}/stays/casablanca`,
    hreflang: {
      en: "/en/stays/casablanca",
      fr: "/fr/stays/casablanca",
      ar: "/ar/stays/casablanca",
    },
    robots: "index,follow",
    destination: {
      id: "1",
      slug: "casablanca",
      name: city,
      countryCode: "MA",
      regionId: null,
      latitude: 33.5,
      longitude: -7.6,
      heroImageUrl: null,
      bestTimeToVisit: "Spring",
      nearbyCitySlugs: [],
      searchCity: city,
      indexable: true,
      seoScore: 80,
      listingCountCache: 10,
    },
    neighborhood: null,
    landmark: null,
    filterLabel: null,
    exploreFilters: { city },
    intelligence: {
      listingCount: 10,
      verifiedCount: 4,
      avgNightlyPrice: 500,
      minPrice: 200,
      maxPrice: 900,
      luxuryCount: 1,
      avgRating: 4.5,
      reviewCount: 3,
      topNeighborhood: null,
      bestMonth: null,
      topAmenities: [],
      topPropertyType: null,
      verifiedPercent: 40,
      currency: "MAD",
    },
    geoBlocks: [],
    faq: [],
    aiSnippets: [],
    nearbyDestinations: [],
    relatedDestinations: [],
    propertyTypeLinks: [
      {
        slug: "apartments",
        label: `Apartments in ${city}`,
        href: `/${locale}/stays/casablanca/apartments`,
      },
    ],
    amenityLinks: [
      {
        slug: "pool",
        label: `Pool in ${city}`,
        href: `/${locale}/stays/casablanca/pool`,
      },
    ],
    neighborhoodLinks: [],
    breadcrumbs: [
      { name: "Home", path: `/${locale}` },
      { name: "Stays", path: `/${locale}/stays` },
      { name: city, path: `/${locale}/stays/casablanca` },
    ],
    indexable: true,
    seoScore: 80,
    lastmod: "2026-01-01T00:00:00.000Z",
    registrySlug: "casablanca",
  };
}

function withSiteUrl<T>(fn: () => T): T {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nexastays.ma";
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
}

test("destination city EN/FR/AR titles and H1s diverge (no English FR/AR)", () => {
  const en = localizeSeoPagePayload(baseCityPage("en"));
  const fr = localizeSeoPagePayload(baseCityPage("fr"));
  const ar = localizeSeoPagePayload(baseCityPage("ar"));

  assert.equal(en.h1, "Stays in Casablanca");
  assert.match(fr.h1, /Séjours à Casablanca/);
  assert.match(ar.h1, /إقامات في Casablanca/);

  assert.notEqual(fr.title, en.title);
  assert.notEqual(ar.title, en.title);
  assert.notEqual(fr.description, en.description);
  assert.notEqual(ar.description, en.description);
  assert.ok(!fr.title.startsWith("Stays in"));
  assert.ok(!ar.title.startsWith("Stays in"));
  assert.equal(fr.breadcrumbs[0]?.name, "Accueil");
  assert.equal(ar.breadcrumbs[1]?.name, "الإقامات");
});

test("marrakech FR/AR also diverge from English", () => {
  const en = localizeSeoPagePayload(baseCityPage("en", "Marrakech"));
  const fr = localizeSeoPagePayload({
    ...baseCityPage("fr", "Marrakech"),
    path: "/fr/stays/marrakech",
    canonical: "/fr/stays/marrakech",
    registrySlug: "marrakech",
    destination: {
      ...baseCityPage("fr", "Marrakech").destination!,
      slug: "marrakech",
      name: "Marrakech",
      searchCity: "Marrakech",
    },
  });
  assert.notEqual(fr.h1, en.h1);
  assert.match(fr.h1, /Marrakech/);
});

test("city metadata uses absolute nexastays.ma canonical + hreflang", () => {
  withSiteUrl(() => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const page = localizeSeoPagePayload(baseCityPage(locale));
      const meta = buildSeoMetadata({
        title: page.title,
        description: page.description,
        path: page.canonical,
        locale,
        robots: page.robots,
      });
      assert.equal(
        meta.alternates?.canonical,
        `https://nexastays.ma/${locale}/stays/casablanca`,
      );
      const languages = meta.alternates?.languages as Record<string, string>;
      assert.equal(languages.en, "https://nexastays.ma/en/stays/casablanca");
      assert.equal(languages.fr, "https://nexastays.ma/fr/stays/casablanca");
      assert.equal(languages.ar, "https://nexastays.ma/ar/stays/casablanca");
      assert.ok(!String(meta.alternates?.canonical).includes("localhost"));
    }
  });
});

test("neighborhood FR/AR with English contentBlocks → noindex", () => {
  const page: SeoPagePayload = {
    ...baseCityPage("fr"),
    pageType: "city_neighborhood",
    neighborhood: { slug: "maarif", name: "Maarif", searchTerm: "Maarif" },
    contentBlocks: {
      hero_intro: "English intro about Maarif.",
      why_stay_here: "English body.",
    },
    robots: "index,follow",
    indexable: true,
  };
  assert.equal(shouldNoindexUntranslatedNeighborhood(page), true);
  const localized = localizeSeoPagePayload(page);
  assert.equal(localized.robots, "noindex,follow");
  assert.equal(localized.indexable, false);
});

test("guide FR/AR English-clone policy forces noindex; EN unchanged", () => {
  const base: SeoGuidePagePayload = {
    pageType: "guide",
    locale: "en",
    slug: "morocco-travel-guide",
    guideType: "travel",
    path: "/en/guides/morocco-travel-guide",
    title: "Morocco Travel Guide | Nexa Stays",
    description: "A guide.",
    h1: "Morocco Travel Guide",
    canonical: "/en/guides/morocco-travel-guide",
    hreflang: {
      en: "/en/guides/morocco-travel-guide",
      fr: "/fr/guides/morocco-travel-guide",
      ar: "/ar/guides/morocco-travel-guide",
    },
    robots: "index,follow",
    bodyHtml: "<p>Hello</p>",
    geoBlocks: [],
    destination: null,
    intelligence: null,
    relatedGuides: [],
    cityGuideLink: null,
    exploreFilters: {},
    breadcrumbs: [
      { name: "Home", path: "/en" },
      { name: "Guides", path: "/en/guides" },
      { name: "Morocco Travel Guide", path: "/en/guides/morocco-travel-guide" },
    ],
    indexable: true,
    seoScore: 80,
    lastmod: "2026-01-01T00:00:00.000Z",
  };

  const en = applyGuideLocaleIndexPolicy(base);
  assert.equal(en.robots, "index,follow");
  assert.equal(en.indexable, true);

  const fr = applyGuideLocaleIndexPolicy({
    ...base,
    locale: "fr",
    path: "/fr/guides/morocco-travel-guide",
    canonical: "/fr/guides/morocco-travel-guide",
  });
  assert.equal(fr.robots, "noindex,follow");
  assert.equal(fr.indexable, false);
  assert.deepEqual(Object.keys(fr.hreflang).sort(), ["en"]);
});

test("sitemap filter drops fr/ar guide articles but not hubs", () => {
  assert.equal(isNonEnglishGuideArticlePath("/fr/guides/morocco-travel-guide"), true);
  assert.equal(isNonEnglishGuideArticlePath("/ar/guides/foo"), true);
  assert.equal(isNonEnglishGuideArticlePath("/en/guides/morocco-travel-guide"), false);
  assert.equal(isNonEnglishGuideArticlePath("/fr/guides"), false);
  assert.equal(isNonEnglishGuideArticlePath("/fr/stays/casablanca"), false);
});
