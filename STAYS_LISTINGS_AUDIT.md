# Guest Listings / Explore Audit

**Classification:** AUDIT ONLY — no product fixes in this turn  
**Date:** 2026-08-12  
**Repos:** `nexastays_web` + `backend/stays` + `database/stays`  
**Surfaces:** `/en/listings`, `/fr/listings`, `/ar/listings` → `GET /stays/explore` (+ `/explore/map`)  

**Evidence labels:** `VERIFIED` · `INFERRED` · `NOT MEASURED` · `PROPOSED`

---

## 1. Executive Summary

Guest Explore already uses **server-side cursor/keyset pagination**, **LIVE-only** visibility, **post-LIMIT media hints**, and a **+1ms `created_at` tie window** that correctly survives JS `toISOString()` microsecond truncation. A DB-mirrored keyset walk of the default LIVE universe loaded **1004/1004** IDs with **0 duplicates** and correct final-page semantics (`VERIFIED`).

The critical correctness gap is **URL ↔ controller filter reachability**: the web client and DTO/service support `amenity`, `pets_allowed`, `luxury_only`, `family_friendly`, `neighborhood`, and `near_*`, but `stays.controller.ts` **does not forward** those fields into `exploreService.exploreListings` / `exploreMap`. Live HTTP comparisons show those query params return the **same first-page IDs as an unfiltered request** (`VERIFIED`). Reserved URL params (`min_price`, `bedrooms`, etc.) are serialized in the browser but never sent to the API (`VERIFIED` as intentional reservation / defect depending on product intent).

**Final verdict:** see last line of this document.

---

## 2. Scope and Hard Freeze

### In scope

| Area | Paths |
| --- | --- |
| Web | `app/[locale]/listings/*`, explore/search/listing card tree, `lib/stays-api.ts`, `lib/search/explore-filter-utils.ts` |
| Stays API | `GET /stays/explore`, `GET /stays/explore/map`, search shim `GET /stays/listings/search` |
| DB | Explore-related indexes (`017_explore_search_indexes.sql` + live index presence) |

### Out of scope / frozen

- Host Portal / Dashboard / Host Bookings / Host Listings / Reviews / Insights / Inbox  
- Guest booking checkout  
- Listing detail except as consumer of explore payloads  
- Any code, API, or migration changes this turn  

### Deliverable

- This file only: `nexastays_web/STAYS_LISTINGS_AUDIT.md`

---

## 3. Architecture

```text
/[locale]/listings/page.tsx  (CSR client page)
        │
        ├─ searchParamsToExploreFilters(URL)
        ├─ exploreFiltersToApiParams → exploreListings(limit=24, cursor?)
        └─ exploreMapPins(bounds) when map layout
                │
                ▼
        lib/stays-api.ts  buildExploreQuery → GET /stays/explore(+map)
                │
                ▼
        stays.controller.ts  explore() / exploreMap()
                │   ⚠ forwards ONLY a subset of DTO fields
                ▼
        ExploreService.exploreListings / exploreMap
                │
                ▼
        queryListings()  WHERE status='LIVE' + filters + keyset
                │
                ├─ availability NOT IN (dated queries)
                └─ loadMediaHints(ids) AFTER page LIMIT
                │
                ▼
        stays_listings (+ rate_plan, rules)  LIVE indexes
```

| Layer | Primary file(s) | Role | Evidence |
| --- | --- | --- | --- |
| Page (CSR) | `app/[locale]/listings/page.tsx` | URL → filters → fetch/replace/append; IO load-more; map bounds | `VERIFIED` |
| Layout / SEO | `app/[locale]/listings/layout.tsx` | `generateMetadata` via static route copy | `VERIFIED` |
| Filter contract | `lib/search/explore-filter-utils.ts` | URL ↔ ExploreFilters ↔ API params | `VERIFIED` |
| API client | `lib/stays-api.ts` | `exploreListings` / `exploreMapPins` | `VERIFIED` |
| Controller | `backend/stays/.../stays.controller.ts` | Public + throttle; **partial forward** | `VERIFIED` |
| DTO | `explore-listings.dto.ts` | Validates amenity/neighborhood/near_*/etc. | `VERIFIED` |
| Service | `explore/explore.service.ts` | Query, cache, cursor encode, media hints | `VERIFIED` |
| Cursor | `explore/explore-cursor.ts` | `v1.` + base64url JSON | `VERIFIED` |
| Indexes | `database/stays/migrations/017_explore_search_indexes.sql` | LIVE created/rating + city lower | `VERIFIED` |

---

## 4. Data Fetch

| Concern | Behavior | Evidence |
| --- | --- | --- |
| First page | Client always sends `limit: 24`; server default 24, max 48 | `VERIFIED` |
| Query change | `useEffect([exploreParams])` sets loading, clears cursor/`hasMore`, **replaces** `listings` (does not append prior query) | `VERIFIED` |
| Load more | Appends with client-side ID de-dupe + lock; IntersectionObserver `rootMargin: 240px` | `VERIFIED` |
| Map | Separate `/explore/map` with required bounds; clears pins on `exploreParams` change; sequence guard against stale responses | `VERIFIED` |
| Search authority | Filters applied in SQL `queryListings`, not client filter of loaded page | `VERIFIED` (for forwarded params) |
| Media | Cover/walkthrough loaded **after** LIMIT via `loadMediaHints(ids)` — no media×LIMIT inflation | `VERIFIED` |
| Cache | In-process memory cache ~45s (15s when dated) keyed by params | `VERIFIED` |

---

## 5. API Surface

| Endpoint | Auth | Throttle | Notes |
| --- | --- | --- | --- |
| `GET /stays/explore` | `@Public` + bot guard | `PUBLIC_SEARCH_THROTTLE` (dev: 50/s short, 200/min; prod tighter) | Card envelope + cursor |
| `GET /stays/explore/map` | same | same | Pins; bounds required; `MAP_PIN_MAX` default 1500 |
| `GET /stays/listings/search` | same | same | Shim → same explore path / same incomplete forward |

Envelope (`VERIFIED`): `items[]`, `pagination.next_cursor`, `pagination.has_more`, `meta.query_ms/sort/cache/total_estimate`.

---

## 6. Search

| Topic | Finding | Evidence |
| --- | --- | --- |
| Free-text “q” | **No** full-text query param on Explore; destination search resolves to **city** (and curated neighborhood slug UX) | `VERIFIED` |
| City | Prefix `LOWER(l.city) LIKE LOWER(:city%)` for index use | `VERIFIED` |
| Universe | Search/filter runs over server LIVE set for forwarded filters — not a client page slice | `VERIFIED` |
| Guest pets count `pets=` | Written to URL from search bar; **not** mapped to `pets_allowed` in `searchParamsToExploreFilters` | `VERIFIED` defect / UX mismatch |

---

## 7. Filters — URL ↔ API ↔ Service Matrix

| URL / client param | Web sends in query string? | DTO accepts? | Controller forwards? | `queryListings` applies? | Live HTTP effect | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| `city` | Yes | Yes | Yes | Yes | Changes results | **OK** `VERIFIED` |
| `checkin_date` / `checkout_date` | Yes | Yes | Yes | Yes (availability `NOT IN`) | Dated path exists | **OK** source `VERIFIED`; availability scale `INFERRED` |
| `guests` | Yes | Yes | Yes | `max_guests >=` | Different first IDs vs plain | **OK** `VERIFIED` |
| `listing_type` | Yes | Yes | Yes | Yes | VILLA-only page | **OK** `VERIFIED` |
| `verified_walkthrough_only` | Yes | Yes | Yes | EXISTS walkthrough | Source | **OK** `VERIFIED` |
| `instant_booking_only` | Yes | Yes | Yes | `instant_booking` | Source | **OK** `VERIFIED` |
| `sort` | Yes | Yes | Yes | ORDER BY + keyset | Source | **OK** `VERIFIED` |
| `limit` / `cursor` | Yes | Yes | Yes | Cap + keyset | Source + smoke | **OK** `VERIFIED` |
| `north/south/east/west` | Map path | Yes | Yes | Geo bounds | Source | **OK** `VERIFIED` |
| `amenity` | Yes | Yes | **No** | Would `@>` amenities | Same IDs as plain | **P0 defect** `VERIFIED` |
| `pets_allowed` | Yes | Yes | **No** | Would pets_policy | Same IDs as plain | **P0 defect** `VERIFIED` |
| `luxury_only` | Yes | Yes | **No** | Would villa/riad/price | Same IDs as plain | **P0 defect** `VERIFIED` |
| `family_friendly` | Yes | Yes | **No** | Would `max_guests >= 4` | Source + controller gap | **P0 defect** `VERIFIED` |
| `neighborhood` | Yes | Yes | **No** | Would LIKE neighborhood | Same IDs as plain | **P0 defect** `VERIFIED` |
| `near_lat` / `near_lng` / `near_radius_km` | Yes | Yes | **No** | Would bbox approx | Source + controller gap | **P0 defect** `VERIFIED` |
| `min_price` / `max_price` / `bedrooms` / `bathrooms` / `min_rating` / `verified_host` / `superhost` / `language` | URL serialize | No | No | No | N/A | **Reserved / no backend** `VERIFIED` |
| `adults` / `children` / `infants` / `pets` / `collection` / `layout` / `version` | UI-only URL | No (explore) | No | No | N/A | **Client UX state** `VERIFIED` |

Controller forward list (`stays.controller.ts` `explore`, lines ~151–166): city, dates, guests, verified/instant, listing_type, limit, cursor, sort, bounds — **nothing else**.

---

## 8. Sort

| Sort | `ORDER BY` | Cursor keys | Index support |
| --- | --- | --- | --- |
| `newest` (default) | `created_at DESC, id DESC` | `c`, `i`, `snapshot`, `s` | `idx_stays_listings_live_created` `VERIFIED` (EXPLAIN Index Only Scan) |
| `rating` | `avg_rating DESC NULLS LAST, review_count DESC, created_at DESC, id DESC` | + `r`, `n` | `idx_stays_listings_live_rating` `VERIFIED` present |
| `price_asc` / `price_desc` | `rp.base_price … NULLS LAST, created_at DESC, id DESC` | + `p` | No dedicated LIVE price index `VERIFIED` absence in pg_indexes sample |

All sorts include **deterministic `id` tie-break** (`VERIFIED`).

---

## 9. Pagination Correctness

### 9.1 Source proofs

| Invariant | Result | Evidence |
| --- | --- | --- |
| Bounded first request | Client `limit: 24`; server clamp 1…48 | `VERIFIED` |
| Cursor tuple | `v1.` + base64url JSON: `v,s,snapshot,c,i` (+ `r,n` / `p`) | `VERIFIED` |
| Timestamp serialization | `buildNextCursor` uses `new Date(created_at).toISOString()` (ms) | `VERIFIED` |
| No precision stall | Keyset uses exclusive **+1ms** window on `created_at` equality branch (comment + SQL) | `VERIFIED` |
| Stable ORDER BY + id | All four sorts | `VERIFIED` |
| Final page | `has_more = rows.length > limit`; `next_cursor` only if hasMore | `VERIFIED` |
| Reset on query change | Effect replaces list; does not append old cursor results | `VERIFIED` |
| LIVE-only | `WHERE l.status = 'LIVE'` | `VERIFIED` |
| Media×LIMIT | Media after page IDs | `VERIFIED` |

### 9.2 Runtime proofs (2026-08-12, local Stays + Postgres `:5434`)

**Status distribution (`VERIFIED`):** LIVE **1004**, SUBMITTED 4, DRAFT 2.

**Sample `created_at` microsecond batching (`VERIFIED`):** multiple LIVE rows share `…14.692162+00` — ISO truncation to `.692Z` would break exact-equality keysets.

| Walk | Method | Pages | Loaded | Universe | Dupes | Missing | Pass |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Default newest +1ms window | SQL mirroring explore keyset + ISO round-trip | 42 | 1004 | 1004 | 0 | 0 | **PASS** |
| City `Casablanca%` +1ms | same | 3 | 70 | 70 | 0 | 0 | **PASS** |
| Exact equality after `toISOString` (no +1ms) | contrast | — | 27 | 1004 | — | 977 | **FAIL** (proves window necessity) |
| Full HTTP cursor walk | `GET /stays/explore` | — | — | — | — | — | **NOT MEASURED** (429 throttle mid-walk) |
| HTTP first page | `limit=24` | 1 | 24 | — | — | — | `has_more=true`, cursor present `VERIFIED` |

HTTP amenity/neighborhood/luxury/pets_allowed first-page IDs **identical** to plain newest (`VERIFIED`) — aligns with controller drop, not pagination failure.

---

## 10. Cards

| Aspect | Finding | Evidence |
| --- | --- | --- |
| Component | `components/listing/ListingCard.tsx` | `VERIFIED` |
| Payload | Explore card → `exploreCardToListing` (cover + walkthrough hint, price, rating) | `VERIFIED` |
| Density | `default` / `compact` | `VERIFIED` |
| Badges | Instant / Verified / Listed; SaveButton | `VERIFIED` |
| Link | Locale listing detail with optional stay params | `VERIFIED` |

---

## 11. Images

| Aspect | Finding | Evidence |
| --- | --- | --- |
| Cover | `getListingMediaUrl(listingId, assetId)` or Unsplash placeholder | `VERIFIED` |
| Next/Image | `fill`, `sizes` responsive, `loading="lazy"`, `unoptimized` for API media | `VERIFIED` |
| Priority | No `priority` on first-row cards — LCP not optimized for above-fold | `INFERRED` risk |
| Error | Fallback placeholder on error | `VERIFIED` |
| Overlay | Gradient + type chip + save — decorative overlays present | `VERIFIED` |

---

## 12. Responsive Layout

| Breakpoint behavior | Finding | Evidence |
| --- | --- | --- |
| Mobile / `<xl` | `ExploreFeed` + filter sheet; filters button `min-h-[44px]` | `VERIFIED` source |
| Desktop `xl+` | Destination context, collections, grid / map split | `VERIFIED` source |
| Layout param | `layout=map|list` | `VERIFIED` |
| Live viewport matrix | Visual QA across devices | **NOT MEASURED** |

---

## 13. RTL (`/ar/listings`)

| Aspect | Finding | Evidence |
| --- | --- | --- |
| Locale shell | `locale === "ar"` → `isRtl` + Arabic font variable on `LocaleShell` | `VERIFIED` |
| Copy | Arabic metadata + i18n keys for listings | `VERIFIED` |
| Explore-specific RTL polish | Mirror of absolute chips / map chrome | **NOT MEASURED** visually |

---

## 14. URL State

| Concern | Finding | Evidence |
| --- | --- | --- |
| Canonical filters | `exploreFiltersToSearchParams` / `searchParamsToExploreFilters` | `VERIFIED` |
| Navigation | `router.replace(localePath(/listings?…))` | `VERIFIED` |
| SEO landing → listings | Shared explore filter helpers | `VERIFIED` |
| Broken expectation | URL can show amenity/neighborhood/luxury/pets/near filters that **do not affect results** | `VERIFIED` P0 |

---

## 15. Loading / Error / Empty

| State | Behavior | Evidence |
| --- | --- | --- |
| Initial load | `ListingGridSkeleton` / feed skeletons | `VERIFIED` |
| Load more | Skeletons + `aria-busy`; observer sentinel | `VERIFIED` |
| Error | `ErrorAlert` dismissible; list cleared on first-fetch error | `VERIFIED` |
| Empty | `listings.noStaysFound` + clear filters CTA when filters active | `VERIFIED` |
| Map empty | Localized empty title/message | `VERIFIED` |
| Map transient error | Keeps previous pins | `VERIFIED` |

---

## 16. SEO

| Aspect | Finding | Evidence |
| --- | --- | --- |
| Metadata | Locale titles/descriptions via `buildPublicStaticMetadata("listings")` | `VERIFIED` |
| Rendering | Listings **page is CSR** — result cards not in initial HTML | `VERIFIED` / crawlability risk `INFERRED` |
| Canonical path | `/listings` under locale | `VERIFIED` |
| Filter URLs | Query-string variants; no SSR for filtered H1 content | `INFERRED` |

---

## 17. Accessibility

| Aspect | Finding | Evidence |
| --- | --- | --- |
| Card image button | `aria-label={title}` | `VERIFIED` |
| Rating | `aria-label` with score + review count | `VERIFIED` |
| Quick filters | `aria-pressed` on verified/instant | `VERIFIED` |
| Load more region | `aria-busy` while loading more | `VERIFIED` |
| Keyboard / screen-reader full pass | — | **NOT MEASURED** |
| Focus management on filter sheet | Present in UI tree | `INFERRED` partial |

---

## 18. Browser / Network / Backend / DB

| Layer | Finding | Evidence |
| --- | --- | --- |
| Browser | Incremental append; replace on filter change; no client-side catalog authority for explore | `VERIFIED` |
| Network | ~24 cards/page; cover media separate GETs; throttle can 429 aggressive walks | `VERIFIED` |
| Backend | Query + optional availability NOT IN + media hints; memory cache | `VERIFIED` |
| Dated availability | Documented scalability limit: global unavailable ID set then `NOT IN` | `VERIFIED` source comment |
| DB indexes | `idx_stays_listings_live_created` used for newest LIMIT 25 (`Index Only Scan`) | `VERIFIED` EXPLAIN |
| Price sorts | No LIVE `(base_price, created_at, id)` index observed | `VERIFIED` |
| Amenity GIN / neighborhood | Filter SQL exists; reachability broken at controller; index needs for those predicates **NOT MEASURED** for prod volume | — |

---

## 19. Security / Abuse

| Control | Finding | Evidence |
| --- | --- | --- |
| Public endpoints | `@Public` explore/map | `VERIFIED` |
| Bot guard | `BotProtectionGuard` | `VERIFIED` |
| Throttle | `PUBLIC_SEARCH_THROTTLE` | `VERIFIED` (HTTP 429 during walk) |
| LIVE media | Media endpoint LIVE-only (related) | `INFERRED` from controller comments |
| Input validation | DTO max lengths / enums / lat-lng ranges | `VERIFIED` |
| Auth secrets in audit | None committed | `VERIFIED` |

---

## 20. Bottleneck Matrix

| Bottleneck | Severity | Notes | Evidence |
| --- | --- | --- | --- |
| Controller drops advanced filters | **P0** | Users believe URL filters work | `VERIFIED` |
| Availability `NOT IN` on dated search | **P1** | Launch-accepted; scales poorly | `VERIFIED` source |
| Price sort without supporting index | **P2** | May seq-scan / sort under growth | `INFERRED` |
| CSR listings SEO | **P2** | Cards not SSR | `INFERRED` |
| Lazy images above fold | **P3** | LCP | `INFERRED` |
| Map pin cap truncation | **P2** | Dense viewports truncate | `VERIFIED` source |
| Throttle vs infinite scroll bursts | **P2** | Possible user 429 under fast scroll in prod limits | `INFERRED` |

---

## 21. Priority Defect Matrix

| ID | Priority | Defect | Proof |
| --- | --- | --- | --- |
| L-P0-1 | **P0** | `amenity`, `pets_allowed`, `luxury_only`, `family_friendly`, `neighborhood`, `near_*` accepted by web + DTO + service but **not forwarded** by controller | Source + HTTP same-IDs |
| L-P0-2 | **P0** | URL/UI can show those filters as “active” while results ignore them | Page `hasSeoFilters` / filter chips + L-P0-1 |
| L-P1-1 | **P1** | Search-bar `pets` count not mapped to `pets_allowed` | URL builders |
| L-P1-2 | **P1** | Dated explore availability uses unbounded unavailable ID set + `NOT IN` | Service comment + code |
| L-P2-1 | **P2** | Reserved price/bedroom/rating URL params have no backend | Filter utils |
| L-P2-2 | **P2** | No LIVE price keyset index | pg_indexes |
| L-P2-3 | **P2** | CSR explore hurts crawlability of result grids | page.tsx client |
| L-P3-1 | **P3** | Card images always `loading="lazy"` | ListingCard |
| L-P3-2 | **P3** | RTL/visual a11y matrix not measured | — |

Pagination precision / duplicate / missing / LIVE / reset: **no P0** found after +1ms window proofs.

---

## 22. Recommended Implementation Phases (`PROPOSED` only)

### Phase A — Filter reachability (correctness)

1. Forward DTO fields already implemented in `queryListings` from `explore` / `exploreMap` / search shim.  
2. Add contract tests: amenity/neighborhood/luxury/pets/family/near change result sets vs control.  
3. Align `pets` search-bar semantics with `pets_allowed` or stop writing misleading URL state.

### Phase B — Availability & indexes

1. Replace explore availability `NOT IN` with scoped `NOT EXISTS` / calendar strategy (ticket already named in source).  
2. Consider LIVE price sort index if price sorts become default traffic.  
3. Re-check amenity JSONB / neighborhood indexes once filters are live.

### Phase C — UX / SEO / perf polish

1. Optional SSR or streaming shell for listings SEO.  
2. `priority` on first N card images.  
3. RTL visual pass; a11y audit of filter sheet + map.  
4. Review prod throttle vs IO load-more cadence.

**Do not** start Host Portal work from this audit.

---

## 23. Test Matrix (`PROPOSED`)

| Case | Expect |
| --- | --- |
| Default newest walk | Unique IDs == LIVE count; final `has_more=false` |
| City + amenity + pets_allowed + luxury + neighborhood + near | Each alone changes membership vs control after Phase A |
| Guests / listing_type / verified / instant / dates | Already should change results |
| Sort switches | Cursor rejected if sort mismatch; new first page |
| Query change mid-scroll | List replaced; no leftover IDs from prior filter |
| DRAFT/SUBMITTED | Never appear |
| Map bounds | Pins only in viewport; truncation flag when dense |
| `/en|/fr|/ar/listings` | Metadata + RTL shell; filters round-trip |
| Throttle | Graceful error UX on 429 |

---

## 24. Evidence Index

| Evidence | Location / method |
| --- | --- |
| Architecture files | Paths in §3 |
| Controller forward gap | `stays.controller.ts` `explore` / `exploreMap` / `searchListings` |
| +1ms keyset | `explore.service.ts` keyset block ~518–597 |
| Cursor codec | `explore-cursor.ts` |
| Web limit/reset | `app/[locale]/listings/page.tsx` |
| URL/API mapping | `lib/search/explore-filter-utils.ts`, `lib/stays-api.ts` `buildExploreQuery` |
| Indexes migration | `database/stays/migrations/017_explore_search_indexes.sql` |
| LIVE counts + µs samples | Postgres 2026-08-12 |
| Keyset walk 1004/1004 | DB-mirrored SQL with ISO round-trip + +1ms |
| Contrast fail 27/1004 | Exact equality after ISO truncation |
| HTTP filter no-op | Amenity/neighborhood/luxury/pets vs plain same IDs |
| HTTP guests/type OK | Different IDs / VILLA-only |
| EXPLAIN newest | `Index Only Scan using idx_stays_listings_live_created` |
| HTTP full walk | Rate-limited (429) — marked NOT MEASURED |

Temporary probe scripts used during audit were **deleted** and are **not** committed.

---

## 25. Verdict Notes

Pagination is production-credible for newest (and structurally sound for other sorts) thanks to the explore +1ms window — the opposite of the historical Host Listings truncation bug. Implementation priority is **controller filter forwarding**, not a pagination rewrite.

AUDIT COMPLETE — READY WITH RISKS
