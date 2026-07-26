import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  searchBarValueFromSearchParams,
  searchBarValueToParams,
} from "@/components/search/search-url";
import {
  exploreFiltersToApiParams,
  searchParamsToExploreFilters,
} from "@/lib/search/explore-filter-utils";

const read = (path: string) => readFileSync(path, "utf8");

test("search journeys preserve dates, guest parts, property type, and extras in shareable URLs", () => {
  const value = {
    destinationId: null,
    city: "Agadir",
    checkin: "2026-08-12",
    checkout: "2026-08-16",
    adults: 2,
    children: 1,
    infants: 1,
    pets: 1,
    listingType: "VILLA",
  };
  const params = searchBarValueToParams(value, {
    verified: true,
    instant: true,
    sort: "price_asc",
    neighborhood: "Marina",
  });
  const restored = searchBarValueFromSearchParams(params);

  assert.equal(restored.city, "Agadir");
  assert.equal(restored.checkin, value.checkin);
  assert.equal(restored.checkout, value.checkout);
  assert.equal(restored.adults, 2);
  assert.equal(restored.children, 1);
  assert.equal(restored.infants, 1);
  assert.equal(restored.pets, 1);
  assert.equal(restored.listingType, "VILLA");
  assert.equal(params.get("guests"), "3");
  assert.equal(params.get("neighborhood"), "Marina");
});

test("invalid deep-linked date ranges never reach discovery or booking state", () => {
  const params = new URLSearchParams({
    city: "Agadir",
    checkin_date: "2026-08-16",
    checkout_date: "2026-08-12",
    guests: "2",
  });

  const restored = searchBarValueFromSearchParams(params);
  assert.equal(restored.checkin, "2026-08-16");
  assert.equal(restored.checkout, "");
  assert.equal(restored.adults, 2);
  assert.equal(
    exploreFiltersToApiParams(searchParamsToExploreFilters(params)).checkout_date,
    undefined,
  );
});

test("authentication state synchronizes logout, JWT refresh, and OTP sessions across tabs", () => {
  const auth = read("contexts/AuthContext.tsx");

  assert.match(auth, /window\.addEventListener\("storage", onStorage\)/);
  assert.match(auth, /\[JWT_KEY, REFRESH_TOKEN_KEY, OTP_SESSION_KEY\]/);
  assert.match(auth, /storageSyncSequence/);
  assert.match(auth, /setTokenType\("otp_session"\)/);
  assert.match(auth, /setTokenType\("none"\)/);
});

test("saved listings synchronize silently across tabs for the active user", () => {
  const host = read("components/saved/SavedExperienceHost.tsx");

  assert.match(host, /event\.key !== `nexa-saved-listings:\$\{userId\}`/);
  assert.match(host, /window\.addEventListener\("storage", onStorage\)/);
  assert.match(host, /silent: true/);
});

test("only the latest map viewport request can replace discovery pins", () => {
  const listings = read("app/[locale]/listings/page.tsx");

  assert.match(listings, /const mapRequestSequenceRef = useRef\(0\)/);
  assert.match(
    listings,
    /requestSequence === mapRequestSequenceRef\.current[\s\S]*setMapPins/,
  );
  assert.match(listings, /mapRequestSequenceRef\.current \+= 1/);
});

test("booking confirmation has an immediate duplicate-submission lock", () => {
  const listing = read("components/listing/ListingDetailPage.client.tsx");

  assert.match(listing, /const bookingSubmissionRef = useRef\(false\)/);
  assert.match(listing, /bookingSubmissionRef\.current\) return/);
  assert.match(listing, /bookingSubmissionRef\.current = true/);
  assert.match(listing, /finally \{[\s\S]*bookingSubmissionRef\.current = false/);
});

test("host draft autosaves are serialized so stale snapshots cannot arrive last", () => {
  const wizard = read("app/[locale]/host/listings/new/page.tsx");

  assert.match(
    wizard,
    /const persistQueueRef = useRef<Promise<void>>\(Promise\.resolve\(\)\)/,
  );
  assert.match(wizard, /persistQueueRef\.current\.then\(run, run\)/);
  assert.match(wizard, /persistQueueRef\.current = queued\.then/);
});
