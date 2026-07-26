import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import en from "@/lib/i18n/locales/en.json";
import fr from "@/lib/i18n/locales/fr.json";
import ar from "@/lib/i18n/locales/ar.json";

const read = (path: string) => readFileSync(path, "utf8");

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

test("French and Arabic locale catalogs have complete English key parity", () => {
  const englishKeys = flattenKeys(en).sort();
  assert.deepEqual(flattenKeys(fr).sort(), englishKeys);
  assert.deepEqual(flattenKeys(ar).sort(), englishKeys);
});

test("review requests ignore responses superseded by a newer sort or page request", () => {
  const reviews = read("components/reviews/ListingReviewsSection.tsx");
  assert.match(reviews, /const requestSequence = \+\+requestSequenceRef\.current/);
  assert.match(
    reviews,
    /if \(requestSequence !== requestSequenceRef\.current\) return;[\s\S]*setReviews/,
  );
});

test("listing detail requests cannot update state after navigation or logout", () => {
  const listing = read("components/listing/ListingDetailPage.client.tsx");
  assert.match(
    listing,
    /getCurrentUserOrNull[\s\S]*if \(!cancelled\) setUserProfile\(profile\)/,
  );
  assert.match(
    listing,
    /getListingAvailability[\s\S]*if \(!cancelled\) setBlockedNights/,
  );
});

test("notification feed invalidates requests when the authenticated token changes", () => {
  const notifications = read("components/mobile/useNotificationsFeed.ts");
  assert.match(notifications, /const requestSequenceRef = useRef\(0\)/);
  assert.match(
    notifications,
    /if \(requestSequence !== requestSequenceRef\.current\) return;/,
  );
  assert.match(
    notifications,
    /requestSequenceRef\.current \+= 1;[\s\S]*setItems\(\[\]\);[\s\S]*\}, \[token\]\)/,
  );
});
