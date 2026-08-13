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

test("mobile listings use the shared step-by-step search flow", () => {
  const listingsSearch = read("components/explore/ExploreStickySearch.tsx");
  const searchFlow = read("components/search/SearchFlow.tsx");

  assert.match(listingsSearch, /sm:hidden[\s\S]*<SearchFlow/);
  assert.match(listingsSearch, /initialValue=\{draft\}/);
  assert.match(listingsSearch, /setMobileOpen\(false\);[\s\S]*onSearch\(next\)/);
  assert.match(searchFlow, /initialValue\?: SearchBarValue/);
});

test("mobile center FAB adapts from search to map and list", () => {
  const nav = read("components/nav/MobileBottomNav.tsx");
  const listings = read("app/[locale]/listings/page.tsx");
  const feed = read("components/explore/feed/ExploreFeed.tsx");
  const header = read("components/explore/ResultsHeader.tsx");

  assert.match(nav, /const isExploreScreen = barePath === "\/listings"/);
  assert.match(
    nav,
    /exploreMode === "list"[\s\S]*\? Map[\s\S]*: List/,
  );
  assert.match(
    nav,
    /next\.set\("layout", nextMode\)/,
  );
  assert.match(nav, /router\.replace\([\s\S]*\{ scroll: false \}/);
  assert.doesNotMatch(nav, /useSearchParams/);
  assert.match(listings, /new CustomEvent\("nexa:explore-mode"/);

  // Phone: pink bottom-nav is sole map/list control — no black ExploreFeed Map FAB.
  assert.doesNotMatch(feed, /explore\.openMap/);
  assert.doesNotMatch(feed, /fixed bottom-\[calc\(5\.5rem/);

  // Tablet: bottom nav is md:hidden; compact ResultsHeader exposes List/Map from md+.
  assert.match(header, /compact \? "hidden md:inline-flex" : "inline-flex"/);
  assert.match(feed, /onLayoutChange=\{onLayoutChange\}/);

  // Tablet map mode keeps a mounted ResultsHeader with canonical setLayout (no black List FAB).
  assert.match(
    listings,
    /effectiveLayout === "map"[\s\S]*<ResultsHeader[\s\S]*onLayoutChange=\{setLayout\}/,
  );
  assert.doesNotMatch(
    listings,
    /md:inline-flex[\s\S]{0,120}listings\.listView/,
  );
  assert.doesNotMatch(
    listings,
    /listings\.listView[\s\S]{0,120}md:inline-flex/,
  );

  // Desktop split: compact cards + pane-width container columns (not blind xl 2-col).
  assert.match(listings, /@container\/split-list/);
  assert.match(listings, /split-list-pane/);
  assert.match(listings, /split-list-cards/);
  assert.match(listings, /@\[32rem\]\/split-list:grid-cols-2/);
  assert.match(
    listings,
    /density=\{\s*\n?\s*effectiveLayout === "split" \? "compact"/,
  );
  assert.doesNotMatch(
    listings,
    /xl:grid-cols-\[minmax\(0,260px\)/,
  );
  assert.doesNotMatch(
    listings,
    /z-layer-drawer xl:hidden/,
  );
  assert.match(listings, /chipsOnly=\{effectiveLayout === "split"\}/);
  assert.match(
    listings,
    /effectiveLayout !== "split" && \(\s*\n?\s*<ExploreCollections/,
  );
  assert.match(
    listings,
    /grid-cols-\[minmax\(0,1fr\)_minmax\(340px,42%\)\]/,
  );
  // Split: Filters only in sticky toolbar — not duplicated in search chrome.
  assert.match(
    listings,
    /effectiveLayout !== "split" \? filtersCta : null/,
  );
  assert.match(
    listings,
    /leading=\{\s*\n?\s*effectiveLayout === "split" \? filtersCta/,
  );
  assert.match(listings, /highlightedId=\{highlightedListingId\}/);
  assert.match(listings, /onHighlightChange=/);
  assert.match(header, /listings\.splitView/);
  assert.match(header, /onLayoutChange\("split"\)/);
  assert.match(header, /layout === "map"/);
  assert.doesNotMatch(header, /layout === "map" \|\| layout === "split"/);

  // Compact is presentation-only; default ListingCard keeps description/CTA/footer.
  const card = read("components/listing/ListingCard.tsx");
  assert.match(card, /density === "compact"/);
  assert.match(card, /listings\.viewStay/);
  assert.match(card, /listings\.contactRevealed/);
  assert.match(card, /LISTING_CARD_IMAGE_RATIO_COMPACT/);
  assert.match(card, /onMouseLeave=\{\(\) => onHighlightChange\?\.\(null\)\}/);
});

test("mobile listing booking bar sits safely below the upper navigation", () => {
  const detail = read("components/listing/ListingDetailPage.client.tsx");

  assert.match(
    detail,
    /top-\[calc\(var\(--nexa-app-banner-h,0px\)\+72px\+env\(safe-area-inset-top\)\)\]/,
  );
  assert.match(
    detail,
    /pb-24 pt-\[calc\(var\(--nexa-app-banner-h,0px\)\+148px\+env\(safe-area-inset-top\)\)\] md:pb-0 md:pt-\[72px\]/,
  );
  assert.doesNotMatch(
    detail,
    /Mobile sticky booking bar[\s\S]{0,240}bottom-\[/,
  );
});

test("mobile listing gallery supports native swipe navigation", () => {
  const gallery = read("components/listing/ListingHeroGallery.tsx");

  assert.match(gallery, /snap-x snap-mandatory overflow-x-auto/);
  assert.match(gallery, /items\.slice\(1\)\.map/);
  assert.match(gallery, /min-w-full shrink-0 snap-center/);
  assert.match(gallery, /Math\.round\(gallery\.scrollLeft \/ gallery\.clientWidth\)/);
  assert.match(gallery, /aria-label=\{`Photo \$\{activePhoto \+ 1\} of \$\{totalCount\}`\}/);
});

test("explore personalization cannot change the first hydration tree", () => {
  const feed = read("components/explore/feed/ExploreFeed.tsx");

  assert.match(
    feed,
    /useState<ExplorePersonalization>\(\{ recentlyViewed: \[\] \}\)/,
  );
  assert.match(
    feed,
    /useEffect\(\(\) => \{[\s\S]*setPersonalization\(getExplorePersonalization\(\)\)/,
  );
  assert.doesNotMatch(
    feed,
    /useState\(\s*getExplorePersonalization\s*\)/,
  );
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

test("authentication uses HttpOnly refresh cookies and synchronizes session changes across tabs", () => {
  const auth = read("contexts/AuthContext.tsx");
  const session = read("lib/auth-session.ts");

  assert.match(auth, /new BroadcastChannel\(AUTH_CHANNEL\)/);
  assert.match(auth, /broadcastAuth\("logout"\)/);
  assert.match(session, /await refreshTokenApi\(\)/);
  assert.doesNotMatch(auth, /localStorage/);
  assert.doesNotMatch(session, /localStorage/);
  assert.match(auth, /setTokenType\("otp_session"\)/);
  assert.match(auth, /setTokenType\("none"\)/);
});

test("authenticated polling waits for stored JWT validation and refresh", () => {
  const auth = read("contexts/AuthContext.tsx");
  const headerApi = read("lib/header-api.ts");
  const headerProvider = read("components/navbar/HeaderStateProvider.client.tsx");

  assert.match(
    auth,
    /setReady\(false\);[\s\S]*setToken\(null\);[\s\S]*await hydrateAuthSession\(\)/,
  );
  assert.match(
    auth,
    /setToken\(result\.accessToken\);[\s\S]*setTokenType\("jwt"\);[\s\S]*setReady\(true\)/,
  );
  assert.doesNotMatch(auth, /setToken\(jwt\);[\s\S]*runAfterIdle/);
  assert.match(
    headerApi,
    /if \(headerRes\.status === 401\) return null;[\s\S]*notifications\/unread-count/,
  );
  assert.match(
    headerProvider,
    /if \(next === null\) \{[\s\S]*await refreshUser\(\)/,
  );
  assert.match(
    headerProvider,
    /if \(isJwtExpired\(token\)\) \{[\s\S]*await refreshUser\(\)/,
  );
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

test("book flow immediately starts payment intent and routes to checkout", () => {
  const listing = read("components/listing/ListingDetailPage.client.tsx");
  const bookingPage = read("app/[locale]/bookings/[id]/page.tsx");

  assert.match(listing, /createPaymentIntent/);
  assert.match(listing, /getCurrentConsents/);
  assert.match(listing, /setBookingPhase\("preparing_payment"\)/);
  assert.match(listing, /\/bookings\/\$\{b\.id\}\?checkout=1/);
  assert.match(bookingPage, /checkoutMode/);
  assert.match(bookingPage, /confirmMockPayment/);
  assert.match(bookingPage, /paymentConfirmRef/);
  assert.match(bookingPage, /preparePaymentIntent/);
  assert.match(bookingPage, /booking-payment/);
});

test("welcome completion forces search spotlight past the normal cooldown", () => {
  const provider = read("components/guidance/ProductGuidanceProvider.tsx");
  const config = read("components/guidance/guidance-config.ts");
  const navbar = read("components/navbar/NavBar.tsx");
  const searchBar = read("components/search/SearchBar.tsx");

  assert.match(provider, /forceRef\.current\.add\("search_fab"\)/);
  assert.match(config, /target: "search-fab\|home-search\|desktop-search"/);
  assert.match(config, /target: "nav-saved\|desktop-saved"/);
  assert.match(navbar, /data-guidance-target="desktop-search"/);
  assert.match(navbar, /data-guidance-target="desktop-saved"/);
  assert.match(searchBar, /data-guidance-target=\{guidanceTarget/);
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
