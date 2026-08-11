import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolvePublicServiceUrl } from "../env";

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

test("deploy templates document TWILIO_PHONE_NUMBER and not TWILIO_FROM_NUMBER", () => {
  for (const rel of [
    "../backend/deploy/env/dogfood.env.example",
    "../backend/deploy/env/staging.env.example",
    "../backend/deploy/env/production.env.example",
  ]) {
    // paths relative to nexastays_web cwd when tests run from web package
  }
  const root = process.cwd().includes("nexastays_web")
    ? `${process.cwd()}/../backend/deploy/env`
    : `${process.cwd()}/backend/deploy/env`;
  for (const name of [
    "dogfood.env.example",
    "staging.env.example",
    "production.env.example",
  ]) {
    const text = readFileSync(`${root}/${name}`, "utf8");
    assert.match(text, /TWILIO_PHONE_NUMBER=/);
    assert.doesNotMatch(text, /^TWILIO_FROM_NUMBER=/m);
    assert.doesNotMatch(text, /\nTWILIO_FROM_NUMBER=/);
  }
});
