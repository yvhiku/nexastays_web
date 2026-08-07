import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { toAppError } from "@/lib/errors";
import { maskSensitiveIdentifier } from "@/lib/privacy";
import {
  safeEmailUrl,
  safeExternalHttpUrl,
  safeInternalPath,
  safeTelephoneUrl,
} from "@/lib/safe-url";
import { sanitizeContentHtml } from "@/lib/seo/sanitize-content-html";

const read = (path: string) => readFileSync(path, "utf8");

test("navigation URL policy rejects executable, credentialed, and cross-origin paths", () => {
  assert.equal(safeInternalPath("/inbox/123?tab=all#latest"), "/inbox/123?tab=all#latest");
  assert.equal(safeInternalPath("//evil.example/path"), null);
  assert.equal(safeInternalPath("javascript:alert(1)"), null);
  assert.equal(safeInternalPath("/safe\\@evil.example"), null);
  assert.equal(safeExternalHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeExternalHttpUrl("https://user:pass@example.com"), null);
  assert.equal(
    safeExternalHttpUrl("https://maps.example/path"),
    "https://maps.example/path",
  );
  assert.equal(safeTelephoneUrl("+212 600-000000"), "tel:+212 600-000000");
  assert.equal(safeTelephoneUrl("javascript:alert(1)"), null);
  assert.equal(safeEmailUrl("support@nexastays.com"), "mailto:support@nexastays.com");
});

test("SEO body HTML is allowlist-sanitized at the server boundary", () => {
  const value = sanitizeContentHtml(
    '<h2 onclick="alert(1)">Guide</h2><script>alert(1)</script>' +
      '<a href="javascript:alert(2)" target="_blank">bad</a>' +
      '<a href="https://nexastays.com" target="_blank">good</a>',
  );
  assert.doesNotMatch(value, /script|onclick|javascript:/i);
  assert.match(value, /rel="noopener noreferrer"/);
});

test("server failures never display backend implementation details", () => {
  const error = {
    isAxiosError: true,
    message: "Request failed",
    config: {},
    toJSON: () => ({}),
    name: "AxiosError",
    response: {
      status: 500,
      data: {
        message: "SQLSTATE password=secret at http://internal-db:5432",
      },
    },
  };
  const normalized = toAppError(error);
  assert.equal(normalized.kind, "server");
  assert.doesNotMatch(normalized.message, /SQLSTATE|password|internal-db/i);
  assert.equal(normalized.details, undefined);
});

test("government identifiers are masked to their final four characters", () => {
  assert.equal(maskSensitiveIdentifier("AB12345678"), "••••••5678");
  assert.equal(maskSensitiveIdentifier("1234"), "••••1234");
});

test("service worker never caches API responses and clears the legacy API cache", () => {
  const worker = read("public/nexa-sw.js");
  const cleanup = read("lib/pwa-sw-update.ts");
  assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
  assert.match(cleanup, /clearSensitiveRuntimeCaches/);
  assert.match(cleanup, /includes\("apis"\)/);
});

test("attachment proxy enforces exact origin, redirect, timeout, and size limits", () => {
  const route = read("app/api/messaging/attachment-download/route.ts");
  assert.match(route, /candidate\.origin === base\.origin/);
  assert.match(route, /redirect: "error"/);
  assert.match(route, /AbortSignal\.timeout\(15_000\)/);
  assert.match(route, /MAX_ATTACHMENT_BYTES/);
});

test("production browser policy permits only the required Sumsub capture origin", () => {
  const config = read("next.config.js");
  assert.match(config, /frame-src 'self'.*\$\{sumsubApiOrigin\}/);
  assert.match(
    config,
    /camera=\(self "https:\/\/api\.sumsub\.com"\), microphone=\(self "https:\/\/api\.sumsub\.com"\)/,
  );
});
