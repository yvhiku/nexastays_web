import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isSafeAppPath,
  resolveLocalizedPath,
} from "../locale-path";

const read = (path: string) => readFileSync(path, "utf8");

test("localized paths preserve dynamic query and hash content", () => {
  assert.equal(
    resolveLocalizedPath("/contact?booking=booking-1#support", "fr"),
    "/fr/contact?booking=booking-1#support",
  );
  assert.equal(
    resolveLocalizedPath("/ar/bookings/booking-1", "fr"),
    "/ar/bookings/booking-1",
  );
});

test("post-auth redirects reject unsafe navigation targets", () => {
  for (const unsafe of [
    "//example.com",
    "https://example.com",
    "/\\example.com",
    "javascript:alert(1)",
  ]) {
    assert.equal(isSafeAppPath(unsafe), false);
  }
});

test("navigation surfaces do not bypass locale routing", () => {
  const registration = read("app/[locale]/registration/page.tsx");
  const wizard = read("components/host/listing-wizard/ListingWizardShell.tsx");
  const booking = read("app/[locale]/bookings/[id]/page.tsx");

  assert.doesNotMatch(registration, /href="\/"/);
  assert.doesNotMatch(wizard, /href="\/"/);
  assert.match(booking, /localePath\(`\/contact\?booking=\$\{booking\.id\}`\)/);
});

test("language switching preserves query strings and hash anchors", () => {
  const language = read("contexts/LanguageContext.tsx");

  assert.match(language, /window\.location\.search/);
  assert.match(language, /window\.location\.hash/);
  assert.match(language, /resolveLocalizedPath\(path, locale\)/);
});
