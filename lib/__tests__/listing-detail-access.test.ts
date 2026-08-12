import assert from "node:assert/strict";
import test from "node:test";
import {
  isListingDetailAvailable,
  isListingDetailIdFormatValid,
  resolveListingDetailPage,
} from "../seo/listing-detail-access";
import {
  fetchSeoListingPage,
  SeoListingFetchError,
} from "../seo/listing-api";
import type { SeoListingPagePayload } from "../seo/types";

function listingPayload(
  overrides: Partial<SeoListingPagePayload> = {},
): SeoListingPagePayload {
  return {
    pageType: "listing",
    locale: "en",
    listingId: "3466a54c-8de9-4547-a357-51e2ad90d9bc",
    path: "/en/listings/3466a54c-8de9-4547-a357-51e2ad90d9bc",
    title: "Test Stay in Casablanca | Nexa Stays",
    description: "A verified stay.",
    h1: "Test Stay",
    canonical: "/en/listings/3466a54c-8de9-4547-a357-51e2ad90d9bc",
    hreflang: {
      en: "/en/listings/3466a54c-8de9-4547-a357-51e2ad90d9bc",
      fr: "/fr/listings/3466a54c-8de9-4547-a357-51e2ad90d9bc",
      ar: "/ar/listings/3466a54c-8de9-4547-a357-51e2ad90d9bc",
    },
    robots: "index,follow",
    ogImageUrl: null,
    listingType: "apartment",
    city: "Casablanca",
    neighborhood: null,
    basePrice: 500,
    currency: "MAD",
    avgRating: 4.5,
    reviewCount: 3,
    hasWalkthrough: false,
    geoLat: 33.5,
    geoLng: -7.6,
    breadcrumbs: [],
    indexable: true,
    seoScore: 80,
    lastmod: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("malformed listing ids are confirmed unavailable (format gate)", () => {
  assert.equal(isListingDetailIdFormatValid("not-a-uuid"), false);
  assert.equal(isListingDetailIdFormatValid("invalid"), false);
  assert.equal(isListingDetailIdFormatValid(""), false);
  assert.equal(
    isListingDetailIdFormatValid("3466a54c-8de9-4547-a357-51e2ad90d9bc"),
    true,
  );
});

test("null payload is unavailable; LIVE noindex payload remains available", () => {
  assert.equal(isListingDetailAvailable(null), false);

  const noindex = listingPayload({
    indexable: false,
    robots: "noindex,follow",
  });
  assert.equal(isListingDetailAvailable(noindex), true);
  assert.equal(noindex.indexable, false);
  assert.equal(noindex.robots.includes("noindex"), true);

  const indexable = listingPayload();
  assert.equal(isListingDetailAvailable(indexable), true);
});

test("resolveListingDetailPage returns null for malformed ids without fetch", async () => {
  const previousFetch = globalThis.fetch;
  let called = 0;
  globalThis.fetch = (async () => {
    called += 1;
    return new Response("{}", { status: 200 });
  }) as typeof fetch;

  try {
    const page = await resolveListingDetailPage("not-a-uuid", "en");
    assert.equal(page, null);
    assert.equal(isListingDetailAvailable(page), false);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("fetchSeoListingPage: 404 and 400 → null (confirmed unavailable)", async () => {
  const previousFetch = globalThis.fetch;
  const previousBase = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = "http://stays.test/api/v1";

  try {
    for (const status of [404, 400] as const) {
      globalThis.fetch = (async () =>
        new Response("not found", { status })) as typeof fetch;
      const page = await fetchSeoListingPage(
        "3466a54c-8de9-4547-a357-51e2ad90d9bc",
        "en",
      );
      assert.equal(page, null);
    }
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
    else process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = previousBase;
  }
});

test("fetchSeoListingPage: 5xx throws (outage ≠ missing listing)", async () => {
  const previousFetch = globalThis.fetch;
  const previousBase = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = "http://stays.test/api/v1";
  globalThis.fetch = (async () =>
    new Response("boom", { status: 503 })) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        fetchSeoListingPage("3466a54c-8de9-4547-a357-51e2ad90d9bc", "en"),
      (err: unknown) =>
        err instanceof SeoListingFetchError && err.status === 503,
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
    else process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = previousBase;
  }
});

test("fetchSeoListingPage: network failure rethrows (outage ≠ null)", async () => {
  const previousFetch = globalThis.fetch;
  const previousBase = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = "http://stays.test/api/v1";
  globalThis.fetch = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;

  try {
    await assert.rejects(
      () =>
        fetchSeoListingPage("3466a54c-8de9-4547-a357-51e2ad90d9bc", "en"),
      (err: unknown) => err instanceof TypeError,
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
    else process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = previousBase;
  }
});

test("resolveListingDetailPage: LIVE noindex payload stays available", async () => {
  const previousFetch = globalThis.fetch;
  const previousBase = process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
  process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = "http://stays.test/api/v1";
  const payload = listingPayload({
    indexable: false,
    robots: "noindex,follow",
  });
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;

  try {
    const page = await resolveListingDetailPage(payload.listingId, "en");
    assert.ok(page);
    assert.equal(isListingDetailAvailable(page), true);
    assert.equal(page.indexable, false);
    assert.equal(page.robots, "noindex,follow");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousBase === undefined) delete process.env.NEXT_PUBLIC_STAYS_API_BASE_URL;
    else process.env.NEXT_PUBLIC_STAYS_API_BASE_URL = previousBase;
  }
});
