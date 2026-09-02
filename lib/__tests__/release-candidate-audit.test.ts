import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("strict production configuration accepts only HTTPS services and non-mock payment", () => {
  const output = execFileSync(process.execPath, ["scripts/verify-production-config.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_IDENTITY_API_BASE_URL: "https://identity.example.test/api/v1",
      NEXT_PUBLIC_STAYS_API_BASE_URL: "https://stays.example.test/api/v1",
      NEXT_PUBLIC_SITE_URL: "https://www.example.test",
      NEXT_PUBLIC_ANALYTICS_ENDPOINT: "https://events.example.test/collect",
      NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT: "https://errors.example.test/collect",
      NEXT_PUBLIC_STAYS_PAYMENT_PROVIDER: "cmi",
      NEXT_PUBLIC_DISABLE_PWA: "false",
      NEXT_PUBLIC_API_BASE_URL: "",
    },
  });
  assert.match(output, /Production configuration contract passed/);
});

test("release configuration checks monitoring, analytics, payment, PWA, and legacy API settings", () => {
  const source = read("scripts/verify-production-config.mjs");
  for (const name of [
    "NEXT_PUBLIC_IDENTITY_API_BASE_URL",
    "NEXT_PUBLIC_STAYS_API_BASE_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_ANALYTICS_ENDPOINT",
    "NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT",
    "NEXT_PUBLIC_STAYS_PAYMENT_PROVIDER",
    "NEXT_PUBLIC_DISABLE_PWA",
    "NEXT_PUBLIC_API_BASE_URL",
  ]) {
    assert.match(source, new RegExp(name));
  }
  assert.match(source, /must not target a loopback host/);
  assert.match(source, /must not be mock/);
});

test("client error monitoring reports sanitized envelopes without stacks or user data", () => {
  const source = read("lib/monitoring.ts");
  assert.match(source, /window-error/);
  assert.match(source, /unhandled-rejection/);
  assert.match(source, /NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT/);
  assert.match(source, /MAX_MESSAGE_LENGTH = 500/);
  assert.doesNotMatch(source, /\bstack\b/);
  assert.doesNotMatch(source, /\btoken\b|\buserId\b|\bemail\b|\bphone\b/);
  assert.match(read("app/[locale]/error.tsx"), /reportClientError\("react"/);
  assert.match(read("app/layout.tsx"), /<ClientMonitoring \/>/);
});

test("analytics and error-reporting origins are admitted by connect-src", () => {
  const source = read("next.config.js");
  assert.match(source, /analyticsOrigin/);
  assert.match(source, /errorReportingOrigin/);
  assert.match(
    source,
    /const connectOrigins = uniqueOrigins\([\s\S]*siteOrigin,[\s\S]*identityOrigin,[\s\S]*staysOrigin,[\s\S]*sumsubApiOrigin,[\s\S]*analyticsOrigin,[\s\S]*errorReportingOrigin,/,
  );
});

test("required release, legal, support, offline, manifest, and icon assets exist", () => {
  for (const path of [
    "app/[locale]/terms/page.tsx",
    "app/[locale]/privacy/page.tsx",
    "app/[locale]/refund/page.tsx",
    "app/[locale]/contact/page.tsx",
    "public/offline.html",
    "public/favicon.ico",
    "public/icons/icon-192.v4.png",
    "public/icons/icon-512.v4.png",
    "public/icons/maskable-512.v4.png",
    "app/manifest.ts",
    "app/robots.ts",
    "app/sitemap.ts",
  ]) {
    assert.ok(existsSync(path), `missing required release asset: ${path}`);
  }
});

test("production console diagnostics remain development-gated", () => {
  const analytics = read("lib/analytics.ts");
  const scroll = read("lib/messaging/scroll-diagnostics.ts");
  const performance = read("lib/messaging/performance.ts");
  assert.match(analytics, /process\.env\.NODE_ENV !== "production"/);
  assert.match(scroll, /process\.env\.NODE_ENV !== "development"/);
  assert.match(performance, /process\.env\.NODE_ENV === "development"/);
});
