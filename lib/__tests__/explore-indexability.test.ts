import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExploreListingsMetadata,
  hasExploreStateParams,
  isTrackingParam,
} from "../seo/explore-indexability";

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

function robotsIndexable(metadata: { robots?: unknown }): boolean {
  const robots = metadata.robots as { index?: boolean; follow?: boolean } | undefined;
  return robots?.index === true && robots?.follow === true;
}

function robotsNoindexFollow(metadata: { robots?: unknown }): boolean {
  const robots = metadata.robots as { index?: boolean; follow?: boolean } | undefined;
  return robots?.index === false && robots?.follow === true;
}

test("tracking param detection", () => {
  assert.equal(isTrackingParam("utm_source"), true);
  assert.equal(isTrackingParam("gclid"), true);
  assert.equal(isTrackingParam("fbclid"), true);
  assert.equal(isTrackingParam("msclkid"), true);
  assert.equal(isTrackingParam("city"), false);
  assert.equal(isTrackingParam("foo"), false);
});

test("empty recognized explore keys count as explore state", () => {
  assert.equal(hasExploreStateParams({ city: "" }), true);
  assert.equal(hasExploreStateParams({ cursor: "" }), true);
  assert.equal(hasExploreStateParams({ guests: "" }), true);
  assert.equal(hasExploreStateParams(new URLSearchParams("city=")), true);
});

test("tracking-only and unknown keys are not explore state", () => {
  assert.equal(hasExploreStateParams({ utm_source: "x" }), false);
  assert.equal(hasExploreStateParams({ gclid: "1" }), false);
  assert.equal(hasExploreStateParams({ fbclid: "1" }), false);
  assert.equal(hasExploreStateParams({ foo: "bar" }), false);
  assert.equal(hasExploreStateParams({}), false);
  assert.equal(hasExploreStateParams(undefined), false);
});

test("base locale listings remain indexable with clean canonical", () => {
  withSiteUrl(() => {
    for (const locale of ["en", "fr", "ar"] as const) {
      const metadata = buildExploreListingsMetadata(locale, {});
      assert.equal(
        metadata.alternates?.canonical,
        `https://nexastays.ma/${locale}/listings`,
      );
      assert.ok(robotsIndexable(metadata));
      assert.doesNotMatch(String(metadata.alternates?.canonical), /\?/);
    }
  });
});

test("empty recognized param triggers noindex with clean canonical", () => {
  withSiteUrl(() => {
    for (const sp of [{ city: "" }, { cursor: "" }, { guests: "" }]) {
      const metadata = buildExploreListingsMetadata("en", sp);
      assert.equal(
        metadata.alternates?.canonical,
        "https://nexastays.ma/en/listings",
      );
      assert.ok(robotsNoindexFollow(metadata));
    }
  });
});

test("tracking-only remains indexable with clean base canonical", () => {
  withSiteUrl(() => {
    for (const sp of [
      { utm_source: "test" },
      { gclid: "abc" },
      { fbclid: "xyz" },
    ]) {
      const metadata = buildExploreListingsMetadata("en", sp);
      assert.equal(
        metadata.alternates?.canonical,
        "https://nexastays.ma/en/listings",
      );
      assert.ok(robotsIndexable(metadata));
    }
  });
});

test("unknown param remains indexable (intentional policy)", () => {
  withSiteUrl(() => {
    const metadata = buildExploreListingsMetadata("en", { foo: "bar" });
    assert.equal(
      metadata.alternates?.canonical,
      "https://nexastays.ma/en/listings",
    );
    assert.ok(robotsIndexable(metadata));
  });
});

test("city multi-filter geo cursor and mixed tracking are noindex", () => {
  withSiteUrl(() => {
    const cases = [
      { city: "casablanca" },
      { city: "casablanca", guests: "4", listing_type: "apartment" },
      {
        near_lat: "33.5731",
        near_lng: "-7.5898",
        near_radius_km: "10",
      },
      { cursor: "test-cursor" },
      { utm_source: "test", city: "casablanca" },
    ];
    for (const sp of cases) {
      const metadata = buildExploreListingsMetadata("en", sp);
      assert.equal(
        metadata.alternates?.canonical,
        "https://nexastays.ma/en/listings",
      );
      assert.ok(robotsNoindexFollow(metadata), JSON.stringify(sp));
      assert.doesNotMatch(String(metadata.alternates?.canonical), /\?/);
    }
  });
});

test("FR and AR query URLs canonicalize to same-locale base", () => {
  withSiteUrl(() => {
    const fr = buildExploreListingsMetadata("fr", { city: "casablanca" });
    const ar = buildExploreListingsMetadata("ar", { city: "casablanca" });
    assert.equal(fr.alternates?.canonical, "https://nexastays.ma/fr/listings");
    assert.equal(ar.alternates?.canonical, "https://nexastays.ma/ar/listings");
    assert.ok(robotsNoindexFollow(fr));
    assert.ok(robotsNoindexFollow(ar));
  });
});
