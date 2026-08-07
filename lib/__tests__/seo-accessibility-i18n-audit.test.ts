import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildSeoPageJsonLd } from "../seo/json-ld";
import {
  buildPrivateMetadata,
  buildPublicStaticMetadata,
} from "../seo/static-route-metadata";
import type { SeoPagePayload } from "../seo/types";

const read = (path: string) => readFileSync(path, "utf8");

function flatten(value: unknown, prefix = "", result = new Set<string>()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, path, result);
    } else {
      result.add(path);
    }
  }
  return result;
}

test("public static metadata is localized with canonical and hreflang URLs", () => {
  const english = buildPublicStaticMetadata("contact", "en");
  const french = buildPublicStaticMetadata("contact", "fr");
  const arabic = buildPublicStaticMetadata("contact", "ar");

  assert.notEqual(english.title, french.title);
  assert.notEqual(french.title, arabic.title);
  assert.equal(english.alternates?.canonical, "/en/contact");
  assert.equal(french.alternates?.canonical, "/fr/contact");
  assert.equal(arabic.alternates?.canonical, "/ar/contact");
  assert.equal(arabic.alternates?.languages?.en, "/en/contact");
  assert.equal(arabic.alternates?.languages?.["x-default"], "/en/contact");
  assert.equal(english.openGraph?.locale, "en_US");
  assert.equal(french.openGraph?.locale, "fr_FR");
  assert.equal(arabic.openGraph?.locale, "ar_MA");
  assert.ok(english.openGraph?.images);
  assert.ok(english.twitter?.images);
});

test("private metadata blocks indexing and image indexing", () => {
  const metadata = buildPrivateMetadata("Private");
  assert.deepEqual(metadata.robots, {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  });
});

test("robots and middleware protect every private route family", () => {
  const robots = read("app/robots.ts");
  const middleware = read("middleware.ts");
  for (const segment of [
    "bookings",
    "my-bookings",
    "profile",
    "inbox",
    "login",
    "registration",
    "saved-listings",
    "host/dashboard",
    "host/listings",
  ]) {
    assert.match(robots, new RegExp(segment.replace("/", "\\/")));
  }
  assert.match(robots, /"\/api\/"/);
  assert.match(middleware, /X-Robots-Tag/);
  assert.match(middleware, /noindex, nofollow, noarchive/);
  assert.match(middleware, /Content-Language/);
});

test("sitemap publishes language alternates and removes duplicate URLs", () => {
  const source = read("app/sitemap.ts");
  const middleware = read("middleware.ts");
  assert.match(source, /alternates:\s*\{\s*languages:/);
  assert.match(source, /new Map\(entries\.map/);
  assert.match(
    middleware,
    /sitemap\\+\.xml/,
    "locale middleware must not redirect the root sitemap",
  );
});

test("destination landing pages use CollectionPage rather than a fabricated lodging entity", () => {
  const payload = {
    locale: "en",
    canonical: "/en/stays/agadir",
    h1: "Stays in Agadir",
    title: "Stays in Agadir",
    description: "Verified stays in Agadir.",
    breadcrumbs: [{ name: "Home", path: "/en" }],
    destination: { name: "Agadir", latitude: 30.4, longitude: -9.6 },
    neighborhood: null,
    landmark: null,
    intelligence: {
      listingCount: 12,
      minPrice: 500,
      maxPrice: 1200,
      currency: "MAD",
      avgRating: 4.8,
      reviewCount: 24,
    },
    faq: [],
    contentBlocks: {},
  } as unknown as SeoPagePayload;
  const nodes = buildSeoPageJsonLd(payload);
  assert.ok(nodes.some((node) => node["@type"] === "CollectionPage"));
  assert.ok(!nodes.some((node) => node["@type"] === "LodgingBusiness"));
  assert.ok(!nodes.some((node) => node["@type"] === "AggregateOffer"));
});

test("English, French, and Arabic translation bundles have identical key coverage", () => {
  const bundles = ["en", "fr", "ar"].map((locale) =>
    flatten(JSON.parse(read(`lib/i18n/locales/${locale}.json`))),
  );
  assert.deepEqual([...bundles[0]].sort(), [...bundles[1]].sort());
  assert.deepEqual([...bundles[0]].sort(), [...bundles[2]].sort());
});

test("global accessibility foundations include a focusable skip target and reduced motion", () => {
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");
  const listings = read("app/[locale]/listings/page.tsx");
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(listings, /<h1 className="sr-only">/);
});

test("core text and action tokens meet WCAG AA contrast on white", () => {
  const luminance = (hex: string) => {
    const channels = hex.match(/../g)!.map((channel) => parseInt(channel, 16) / 255);
    const [r, g, b] = channels.map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrastOnWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);
  assert.ok(contrastOnWhite("C42A58") >= 4.5);
  assert.ok(contrastOnWhite("79636E") >= 4.5);
  const tokens = read("tailwind.config.ts");
  assert.match(tokens, /primary: "#C42A58"/);
  assert.match(tokens, /"ink-4": "#79636E"/);
});

test("native image elements declare alternative text", () => {
  const files = [
    "components/avatar/UserAvatar.tsx",
    "components/ProfileAvatar.tsx",
    "components/listing/ListingDetailPage.client.tsx",
    "components/messaging/ProgressiveImage.tsx",
    "components/reviews/ListingReviewsSection.tsx",
  ];
  for (const file of files) {
    const source = read(file);
    const tags = source.match(/<img\b[\s\S]*?\/>/g) ?? [];
    for (const tag of tags) {
      assert.match(tag, /\balt=/, `${file} has an img without alt text`);
    }
  }
});
