import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  getPublicSiteUrl,
  resolvePublicServiceUrl,
  toPublicAbsoluteUrl,
} from "../env";
import { buildSeoMetadata } from "../seo/metadata";

test("production requires explicit non-loopback Identity API URL", () => {
  assert.throws(
    () =>
      resolvePublicServiceUrl(
        undefined,
        "http://localhost:3001/api/v1",
        "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
        "production",
      ),
    /required when NODE_ENV=production/,
  );
  assert.throws(
    () =>
      resolvePublicServiceUrl(
        "http://127.0.0.1:3001/api/v1",
        "http://localhost:3001/api/v1",
        "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
        "production",
      ),
    /must not target localhost/,
  );
  assert.equal(
    resolvePublicServiceUrl(
      "https://identity.dogfood.example/api/v1",
      "http://localhost:3001/api/v1",
      "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
      "production",
    ),
    "https://identity.dogfood.example/api/v1",
  );
});

test("development keeps localhost fallback", () => {
  assert.equal(
    resolvePublicServiceUrl(
      undefined,
      "http://localhost:3001/api/v1",
      "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
      "development",
    ),
    "http://localhost:3001/api/v1",
  );
});

test("production SITE_URL rejects missing and loopback origins", () => {
  assert.throws(
    () =>
      resolvePublicServiceUrl(
        undefined,
        "http://localhost:3005",
        "NEXT_PUBLIC_SITE_URL",
        "production",
      ),
    /required when NODE_ENV=production/,
  );
  assert.throws(
    () =>
      resolvePublicServiceUrl(
        "http://localhost:3005",
        "http://localhost:3005",
        "NEXT_PUBLIC_SITE_URL",
        "production",
      ),
    /must not target localhost/,
  );
  assert.equal(
    resolvePublicServiceUrl(
      "https://nexastays.ma/",
      "http://localhost:3005",
      "NEXT_PUBLIC_SITE_URL",
      "production",
    ),
    "https://nexastays.ma",
  );
});

test("toPublicAbsoluteUrl joins site-relative paths and rejects externals", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nexastays.ma/";
  try {
    assert.equal(getPublicSiteUrl(), "https://nexastays.ma");
    assert.equal(
      toPublicAbsoluteUrl("/en/listings"),
      "https://nexastays.ma/en/listings",
    );
    assert.equal(
      toPublicAbsoluteUrl("en/listings"),
      "https://nexastays.ma/en/listings",
    );
    assert.equal(
      toPublicAbsoluteUrl("/en/listings?cursor=abc#frag"),
      "https://nexastays.ma/en/listings",
    );
    assert.throws(
      () => toPublicAbsoluteUrl("https://evil.example/phish"),
      /site-relative/,
    );
    assert.throws(() => toPublicAbsoluteUrl("//evil.example"), /site-relative/);
    assert.throws(
      () => toPublicAbsoluteUrl("javascript:alert(1)"),
      /site-relative/,
    );
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("buildSeoMetadata emits absolute canonical/hreflang without query params", () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://nexastays.ma";
  try {
    const metadata = buildSeoMetadata({
      title: "Explore",
      description: "Explore stays",
      path: "/en/listings?cursor=abc&sort=price_asc",
      locale: "en",
    });
    assert.equal(
      metadata.alternates?.canonical,
      "https://nexastays.ma/en/listings",
    );
    assert.equal(
      metadata.alternates?.languages?.fr,
      "https://nexastays.ma/fr/listings",
    );
    assert.equal(
      metadata.alternates?.languages?.["x-default"],
      "https://nexastays.ma/en/listings",
    );
    assert.equal(metadata.openGraph?.url, "https://nexastays.ma/en/listings");
    assert.doesNotMatch(String(metadata.alternates?.canonical), /\?/);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test("deploy templates document TWILIO_PHONE_NUMBER and not TWILIO_FROM_NUMBER", () => {
  const roots = [
    resolve(process.cwd(), "..", "nexastays_backend", "deploy", "env"),
    resolve(process.cwd(), "nexastays_backend", "deploy", "env"),
  ];
  const root = roots.find((candidate) => existsSync(candidate));
  // The backend owns these templates and may not be present in a standalone
  // web checkout (for example, the web repository's CI runner).
  if (!root) return;
  for (const name of [
    "dogfood.env.example",
    "staging.env.example",
    "production.env.example",
  ]) {
    const text = readFileSync(join(root, name), "utf8");
    assert.match(text, /TWILIO_PHONE_NUMBER=/);
    assert.doesNotMatch(text, /^TWILIO_FROM_NUMBER=/m);
    assert.doesNotMatch(text, /\nTWILIO_FROM_NUMBER=/);
  }
});
