# Host Portal Performance & Pagination Audit

**Classification:** Host Portal Performance & Pagination Audit (not Phase 8)  
**Date:** 2026-08-12  
**Repos:** `nexastays_web` + `backend/stays` + `database/stays`  
**Mode:** AUDIT ONLY — no API/UI/DB implementation in this turn  

**Evidence labels used below:** `VERIFIED` · `INFERRED` · `NOT MEASURED` · `PROPOSED`

---

## 1. Executive Summary

Host Portal **Bookings** and **Listings** load the **entire host collection** in one unauthenticated-query-parameter GET, then perform filter, search, sort, and summary counts **in the browser**. There is **NO SERVER-SIDE PAGINATION** on either list endpoint.

As portfolio size grows, cost grows linearly in:

1. Database (full `getMany()` / `find()` with heavy relations)  
2. Network (full JSON including listing `media[]` and booking nested listing media)  
3. Browser (filter/sort/counts over the full array; render all matching cards)

**Root cause (VERIFIED):** unbounded collection APIs + client-side authority for filter/search/sort/counts.

**Final verdict:** `READY WITH RISKS`

Primary recommendation (`PROPOSED`): introduce **cursor/keyset pagination** with **stable ordering**, move filter/search/sort **server-side**, return **portfolio counts** as API metadata, slim list payloads (especially listing cover media), and use **IntersectionObserver** (or explicit Load More) for incremental append — **after** implementation approval.

---

## 2. Scope and Hard Freeze

### In scope

- `/host/bookings`, `/host/listings`
- Web → API → service → ORM → DB → payload → browser
- Export path for bookings (scalability only)
- Interaction with existing client-side sort helpers
- Reviews pagination noted as precedent only

### Hard freeze (not modified this turn)

- Portal shell / Phases 1–7 surfaces  
- Guest UI, auth/verification semantics  
- Booking/listing business rules  
- Controllers, services, migrations, indexes (inspect only)  
- No infinite scroll / API / UI implementation  

### Allowed change

- This document only: `HOST_PORTAL_PERFORMANCE_AUDIT.md`

---

## 3. Current Architecture

```text
                    Host Portal (APPROVED gate)
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
     /host/bookings                 /host/listings
            │                             │
   getHostBookings()              getHostListings()
            │                             │
   GET /stays/host/bookings       GET /stays/host/listings
   (no page/limit/cursor)         (no page/limit/cursor)
            │                             │
   stays.service.getHostBookings  hostListingsService.getHostListings
   getMany() + joins              find() + relations
            │                             │
   Entire HostBooking[]           Entire HostListingSummary[]
            │                             │
   CLIENT: filter/search/sort     CLIENT: filter/search/sort
   CLIENT: summary counts         CLIENT: filter counts
   Render ALL visible cards       Render ALL visible cards
```

**VERIFIED:** scrolling does **not** trigger additional list fetches today.

---

## 4. Bookings Data Flow

```text
Host
 ↓
app/[locale]/host/(portal)/(content)/bookings/page.tsx
  loadBookings() → getHostBookings(token)
  also getHostListings(token) for filter/export listing select
 ↓
lib/stays-api.ts getHostBookings
  GET /stays/host/bookings  (Authorization only)
 ↓
stays.controller.ts getHostBookings(@CurrentUser)
 ↓
stays.service.ts getHostBookings(hostUserId)
  QueryBuilder:
    innerJoinAndSelect listing
    leftJoinAndSelect listing.check_in_contact
    leftJoinAndSelect listing.media
    leftJoinAndSelect occupants
    WHERE listing.host_user_id = :hostUserId
    ORDER BY b.created_at DESC
    getMany()   ← NO take/skip
 ↓
map → toBookingResponse(..., includeOccupants=true, hostView=true)
  + guest_name / guest_phone
 ↓
Entire HostBooking[] in React state
 ↓
HostBookingsPage
  counts = bookings.filter(matchesHostBookingFilter)  // full array
  visible = sortHostBookings(filterHostBookings(...)) // full array
 ↓
HostBookingsList → map every visible booking → HostBookingCard
```

**Filter change:** updates URL `?filter=` and re-runs client helpers — **no refetch** (`VERIFIED`: `HostBookingsPage` / route page).  
**Scroll:** no network (`VERIFIED`: no IntersectionObserver / load-more in bookings components).

---

## 5. Listings Data Flow

```text
Host
 ↓
app/[locale]/host/(portal)/(content)/listings/page.tsx
  refreshListings() → getHostListings(token)
 ↓
lib/stays-api.ts getHostListings
  GET /stays/host/listings
 ↓
stays.controller.ts → hostListingsService.getHostListings
 ↓
listingRepo.find({
  where: { host_user_id: userId },
  relations: ['rate_plan', 'rules', 'media', 'unit_types'],
  order: { created_at: 'DESC' },
})   ← NO take/skip
 ↓
toHostListingSummary() — includes FULL media[] + unit_types[] + rules + rate_plan + completion
 ↓
Entire HostListingSummary[] in React state
 ↓
HostListingsPage
  counts = countHostListingsByFilter(listings)
  visible = sortHostListings(filterHostListings(...), sort)
 ↓
HostListingsGrid → HostListingCard
  uses listingCoverMediaUrl(listing)  // picks ONE cover from full media[]
```

**Scroll:** no additional fetch (`VERIFIED`).

---

## 6. API Contract Audit

| Endpoint | Query params | Response | Pagination |
| -------- | ------------ | -------- | ---------- |
| `GET /stays/host/bookings` | none | `HostBooking[]` | **NO SERVER-SIDE PAGINATION** |
| `GET /stays/host/bookings/export` | `period`, `from`, `to`, `listing_id`, `status`, `format` | CSV blob | N/A (full filtered export query) |
| `GET /stays/host/listings` | none | summary array | **NO SERVER-SIDE PAGINATION** |
| `GET /stays/host/reviews` | `page`, `limit`, `sort` | paginated envelope | Offset-style (`VERIFIED` precedent) |

**Sources:** `lib/stays-api.ts` (`getHostBookings`, `getHostListings`, `exportHostBookingsCsv`); `stays.controller.ts` routes above.

Absent on list endpoints: `page`, `limit`, `offset`, `cursor`, `next_cursor`, `has_next`, `total`, `total_pages`.

---

## 7. Backend Service Audit

### Bookings — `StaysService.getHostBookings`

**SOURCE:** `backend/stays/src/modules/stays/stays.service.ts` ~813–831

- AuthZ: host ownership via `listing.host_user_id`  
- Eager: listing, check_in_contact, **all listing media**, occupants  
- Order: `b.created_at DESC` only (no `id` tie-break)  
- Serialization: `toBookingResponse` embeds listing subset **including full listing.media**  

**INFERRED:** Host booking cards use `listing.title` / `city` only (`HostBookingCard.tsx`) — listing media is loaded/serialized but unused in portal list UI.

### Bookings export — `exportHostBookingsCsv`

**SOURCE:** same file ~834–912

- Separate query: listing + occupants (no media join)  
- Server-side period / listing_id / status filters  
- `orderBy created_at DESC` + `getMany()` — **full filtered set**, not paginated  
- Independent of client in-memory array (`VERIFIED`: route calls `exportHostBookingsCsv`)

### Listings — `HostListingsService.getHostListings`

**SOURCE:** `backend/stays/src/modules/stays/services/host-listings.service.ts` ~66–72, ~327–404

- Relations: `rate_plan`, `rules`, `media`, `unit_types`  
- Order: `created_at DESC` only  
- `toHostListingSummary` returns **full media array**, all unit_types, rules, completion payload, address fields  

**INFERRED:** Card needs cover URL + title/city/status/price/completion — not full media/unit_types/rules dumps.

---

## 8. ORM / Query Audit

### Bookings list

| Item | Finding | Label |
| ---- | ------- | ----- |
| Base | `stays_bookings` aliased `b` | VERIFIED |
| Joins | INNER listing; LEFT check_in_contact, media, occupants | VERIFIED |
| Pagination | none | VERIFIED |
| ORDER BY | `created_at DESC` | VERIFIED |
| N+1 | Single query with joins (not classic N+1) | VERIFIED |
| Join multiplication | LEFT JOIN media + occupants can multiply rows before hydration; TypeORM `getMany` reconstitutes entities but DB work still pays for fan-out | INFERRED |
| Unused for list UI | listing.media, check_in_contact | VERIFIED (card usage) |

### Listings list

| Item | Finding | Label |
| ---- | ------- | ----- |
| Base | `stays_listings` | VERIFIED |
| Relations | rate_plan, rules, media, unit_types | VERIFIED |
| Pagination | none | VERIFIED |
| ORDER BY | `created_at DESC` | VERIFIED |
| N+1 | Eager relations avoid N+1; payload heavy | VERIFIED |
| Serialization | Full media + unit_types mapped for every listing | VERIFIED |

---

## 9. Database / Index Audit

**SOURCE:** `database/stays/migrations/001_stays_core_tables.sql`, `003_stays_production_schema.sql`, `017_explore_search_indexes.sql`, `018_listing_draft_lifecycle.sql`

### Existing (relevant)

| Index | Supports |
| ----- | -------- |
| `idx_stays_listings_host` (`host_user_id`) | Host listing list WHERE |
| `idx_stays_listings_status` | Status filters |
| `idx_stays_listings_city` / `idx_stays_listings_city_lower` | City (explore-oriented; lower index helps ILIKE-style search if used) |
| `idx_stays_listings_city_status` | Combined city+status |
| `idx_stays_listings_draft_lifecycle` | Draft lifecycle |
| `idx_stays_bookings_listing` | Join booking→listing |
| `idx_stays_bookings_status` | Status |
| `idx_stays_bookings_dates` | checkin/checkout |
| `idx_stays_bookings_listing_dates_status` | listing+dates+status |
| `idx_stays_listing_media_listing` | Media by listing |

### Gaps vs host list queries

| Need | Status | Classification |
| ---- | ------ | -------------- |
| Host bookings ordered by `created_at` via listing.host | No composite `(host_user_id via join) + booking.created_at` | **RECOMMENDED** after pagination: e.g. query rewrite joining listings with index-friendly plan, or denormalize host_id on bookings if ever added |
| `ORDER BY created_at, id` for keyset | No dedicated `(created_at DESC, id)` on bookings | **RECOMMENDED** with cursor pagination |
| Listings `ORDER BY created_at DESC, id` for host | Host index exists; compound `(host_user_id, created_at DESC, id)` absent | **RECOMMENDED** |
| Title search (ILIKE) | No trigram/title index for host search | **OPTIONAL** until search volume justifies |
| Do not create indexes in this audit | — | **NOT NEEDED now** |

---

## 10. Payload Audit

### Bookings response (per item)

Includes: booking financials, lifecycle fields, occupants (host view phones/emails), nested `listing` with **media[]**, check-in fields when revealed, guest_name/phone.

Portal list card uses: guest, property title/city, dates, status, amount, CTAs — **not** listing media (`VERIFIED`: `HostBookingCard.tsx`).

### Listings response (per item)

Includes: identity/location/description/policies/safety, completion, rate_plan, **rules**, **full media[]**, **all unit_types**, timestamps.

Portal card uses: cover via `listingCoverMediaUrl`, title, city, status, nightly price, completion %, actions (`VERIFIED`).

### Runtime sizes

**NOT MEASURED** — no authenticated payload capture in this audit. No invented KB/MB figures.

**INFERRED impact:** payload scales with (bookings × media-per-listing) + (listings × media-per-listing × unit_types).

---

## 11. Browser / Rendering Audit

| Behavior | Evidence | Label |
| -------- | -------- | ----- |
| Full array in React state | bookings/listings route pages | VERIFIED |
| Counts over full array | `HostBookingsPage` counts `useMemo`; `countHostListingsByFilter` | VERIFIED |
| Filter+search+sort client | `filterHostBookings` / `sortHostBookings`; `filterHostListings` / `sortHostListings` | VERIFIED |
| Render all visible cards | `HostBookingsList.map`; listings grid map | VERIFIED |
| No progressive fetch | No sentinel / load-more | VERIFIED |
| Cover image | `HostListingCard` + `listingCoverMediaUrl` → media URL; no explicit `loading="lazy"` found in card snippet | VERIFIED / NOT MEASURED browser cost |
| Bookings also fetches all listings | Route loads `getHostListings` for select/export | VERIFIED |

**Critical semantic issue (INFERRED → architectural VERIFIED pattern):** If only page 1 were loaded without moving filters server-side, a host with matching “today” rows on page 17 would see empty “today” — **client filters cannot remain authoritative after pagination**.

---

## 12. Performance Bottleneck Matrix

| Bottleneck | Layer | Severity | Justification |
| ---------- | ----- | -------- | ------------- |
| Full dataset fetch | API | **Critical** | Unbounded `getMany`/`find` |
| Heavy joins (booking media/occupants) | DB/ORM | **High** | Media unused in list UI still loaded |
| Full listing media/unit_types | Network/API | **High** | Card needs cover only |
| Client filtering/sorting/counts | Browser | **High** | O(n) grows with portfolio; wrong under fake pagination |
| Full DOM for large visible sets | Browser | **Medium–High** | Renders all matches after client filter |
| Export full getMany | API/DB | **Medium** | Separate path; scales with export filter size |
| Missing compound indexes | DB | **Medium** | Matters more once paginated ORDER BY exists |
| Host list Redis cache | Cache | **Low / Not needed** | Personalized; freshness/auth complexity |

---

## 13. Pagination Strategy Analysis

### Option A — Offset (`?page=&limit=`)

- **Pros:** Matches host **reviews** precedent (`page`/`limit`); simple UI.  
- **Cons:** Skip cost; duplicates/skips when rows insert/delete while scrolling; bad with unstable order.

### Option B — Cursor / keyset (`?limit=&cursor=`)

- **Pros:** Stable forward pagination; better for growing booking histories; aligns with “append while scrolling”.  
- **Cons:** Slightly more frontend state; opaque cursors; ops-urgency sort needs a defined sort key.

### Option C — Explicit “Load more”

- Same backend as A or B; clearer a11y; less accidental multi-fetch.

**Decision (PROPOSED):**

> **Cursor/keyset pagination + IntersectionObserver (with Load More fallback for a11y)** as the target architecture for Bookings and Listings.

Use Nest-style query validation (like reviews) but prefer **cursor** over offset for host collections that grow and receive concurrent inserts. Reviews may remain offset — different scale/product surface.

**Page size (PROPOSED):** `limit` default **20**, max **50** (align with reviews clamp pattern).

---

## 14. Stable Ordering Analysis

**Current:** `ORDER BY created_at DESC` only (`VERIFIED`) — ties possible → **unstable pagination**.

**PROPOSED stable default:**

```text
ORDER BY created_at DESC, id DESC
```

For check-in sort: `checkin_date ASC/DESC, id DESC`  
For amount: `total_subtotal DESC/ASC, id DESC`  
For ops: explicit rank expression or CASE + `checkin_date` + `id` (must be documented in implementation).

Stable ordering is **REQUIRED** for any pagination without duplicates/skips.

---

## 15. Server-Side Filtering/Search Requirements

### Bookings

| Operation | Current location | Server-side required once paginated? | Reason |
| --------- | ---------------- | ------------------------------------ | ------ |
| all / today / upcoming / current / awaiting_payment / completed / cancelled / checkin_today / checkout_today | CLIENT (`matchesHostBookingFilter`) | **YES** | Page slice cannot represent filter universe |
| listing_id select | CLIENT | **YES** | Same |
| search (guest, title, id, reference) | CLIENT (`matchesHostBookingSearch`) | **YES** | Matches may be off-page |
| sort ops / checkin / checkout / amount / guest | CLIENT (`sortHostBookings`) | **YES** | Global order |
| Casablanca “today” boundaries | CLIENT (`casablancaYmd`) | **YES (server TZ)** | Must match H3 TZ semantics on server |

### Listings

| Operation | Current location | Server-side required? | Reason |
| --------- | ---------------- | --------------------- | ------ |
| status filters (all/active/pending/paused/draft/needs_changes) | CLIENT | **YES** | Counts + page correctness |
| search title/city | CLIENT | **YES** | Off-page matches |
| sort default/title/city/status/updated/price | CLIENT | **YES** (except pure `default` = API order with stable id) | Global order |

---

## 16. Sorting Compatibility Analysis

| Surface | Sort | Compatibility under pagination |
| ------- | ---- | ------------------------------ |
| Bookings | ops, checkin, checkout, amount, guest | **Must become server-side** |
| Listings | default, title, city, status, updated, price | **Must become server-side** (default = stable created_at,id) |
| Reviews | newest/highest/lowest | **Already server-side** (`listHostReviews` + `sort`) |
| Insights | property sorts | **May remain client-side** if analytics returns bounded property list per period (`INFERRED` — analytics already period-scoped; confirm size in impl) |

Existing client sort helpers remain valid only while full arrays are loaded; they become **incorrect** as soon as the API returns a page.

---

## 17. Summary Count Strategy

**Current (VERIFIED):** counts derived from full in-memory arrays (`HostBookingsPage` / `countHostListingsByFilter`). Header count uses `bookings.length` / `listings.length`.

**PROPOSED:** Include `counts` (or `facets`) on the **list response** (or a lightweight sibling endpoint if query cost warrants), computed with the **same AuthZ and search scope**, independent of `limit`.

- Bookings: today / upcoming / current / completed (+ optional awaiting_payment, cancelled, checkin_today, checkout_today)  
- Listings: all / active / pending / paused / draft / needs_changes  

Prefer **one round-trip** with list page: `items` + `pagination` + `counts`. Separate aggregate endpoint is OPTIONAL if list latency suffers.

**Omit counts:** NOT recommended — tabs already show counts in UI.

---

## 18. Incremental Loading Recommendation

**PROPOSED UX:**

1. Initial: header + summary + first page (~20 cards) + existing skeletons  
2. Sentinel near list end via **IntersectionObserver**  
3. Fetch next cursor; **append**; keep prior cards  
4. Stop when `has_next === false`  
5. Page-2 failure: keep page-1; show load-more error + retry  
6. Filter/search/sort change: **reset cursor**, replace items (not append)  
7. Provide **Load more** button as progressive enhancement / a11y backup  

**Not predetermined:** infinite scroll alone without server pagination is **forbidden** (fake pagination).

---

## 19. Media / Image Strategy

| Finding | Label |
| ------- | ----- |
| Listings API returns full `media[]` | VERIFIED |
| Card needs one cover URL | VERIFIED (`listingCoverMediaUrl`) |
| Bookings API loads listing.media unused by HostBookingCard | VERIFIED |

**PROPOSED:**

- List DTO: `cover_media: { asset_id, kind } | null` (or single URL field) — drop full media/unit_types/rules from list  
- Detail endpoints retain full media  
- Bookings list: omit listing.media / check_in_contact unless product requires  
- Lazy-load cover images in UI during P2/P3  

---

## 20. Export Scalability

**VERIFIED:** Export is a **separate** server query with filters; does not depend on client `HostBooking[]`.

**INFERRED risk:** `getMany()` on large date ranges still loads all matching rows into memory for CSV build.

**PROPOSED:** Keep export separate from list pagination. Future: streaming CSV / chunked query (RECOMMENDED when export volume hurts). Not a blocker for list pagination P0–P2.

---

## 21. Cache Analysis

Explore uses process-local TTL cache (`explore.service.ts`) — **not** used for host bookings/listings (`VERIFIED` by absence on host list paths).

| Approach | Classification |
| -------- | -------------- |
| Redis cache of host full lists | **NOT NEEDED** (auth-scoped, high churn, stale risk) |
| HTTP CDN cache | **NOT NEEDED** (Authorization required) |
| Client React Query cache of pages | **OPTIONAL** in frontend P2 for back-nav |

---

## 22. Proposed Future API Contracts

**Label: `PROPOSED — NOT IMPLEMENTED`**

### Bookings

```http
GET /stays/host/bookings
  ?limit=20
  &cursor=<opaque|omit for first page>
  &filter=all|today|upcoming|current|awaiting_payment|completed|cancelled|checkin_today|checkout_today
  &search=<string>
  &listing_id=<uuid>
  &sort=ops|checkin|checkout|amount|guest|created_at
```

```ts
// PROPOSED response
{
  items: HostBooking[], // slim listing embed
  pagination: {
    has_next: boolean,
    next_cursor: string | null,
    limit: number
  },
  counts: {
    all: number,
    today: number,
    upcoming: number,
    current: number,
    awaiting_payment: number,
    completed: number,
    cancelled: number,
    checkin_today?: number,
    checkout_today?: number
  }
}
```

### Listings

```http
GET /stays/host/listings
  ?limit=20
  &cursor=<opaque>
  &status=all|active|pending|paused|draft|needs_changes
  &search=<string>
  &sort=default|title|city|status|updated|price
```

```ts
{
  items: HostListingListItem[], // cover_media, not full media[]
  pagination: { has_next, next_cursor, limit },
  counts: {
    all, active, pending, paused, draft, needs_changes
  }
}
```

Preserve JWT host AuthZ; never accept `hostId` from client (existing rule).

---

## 23. Future Implementation Plan

### Performance P0 — Contract

- Finalize query/response shapes, stable order, filter/search/sort enums  
- Document Casablanca TZ for “today” filters  

### Performance P1 — Backend

- Controllers + DTO validation  
- Keyset queries + counts  
- Slim serializers (no unused media on list)  
- Indexes as RECOMMENDED  

### Performance P2 — Frontend

- Paginated fetch; reset on filter/search/sort  
- IntersectionObserver + load-more fallback  
- Loading-more / page-2 error / end-of-list  
- Keep Phase 3/4 card presentation  

### Performance P3 — Payload polish

- Cover-only media; drop unit_types from list  
- Bookings listing embed trim  

### Performance P4 — Validation

- Large fixtures; concurrent scroll; filter races; AuthZ isolation; export unchanged behavior  

---

## 24. Future Test Matrix

### Bookings

- first / next / final page; invalid cursor; duplicate fetch guard  
- insert/cancel during scroll (no dup/skip under cursor)  
- each filter + search + sort + pagination  
- filter/search/sort **resets** cursor  
- page-2 error keeps page-1 + retry  
- empty vs filter-empty vs error  
- host isolation  

### Listings

- equivalent + status filters + cover present/absent  

### Scale targets (fixtures — not measured here)

- 100 / 500 / 1_000 / 5_000 listings  
- comparable booking volumes  

### Regression

- dashboard / analytics / reviews / inbox / shell / verification unchanged  

---

## 25. Success Criteria

- Initial request returns **bounded** `limit` items (not full portfolio)  
- Scroll fetches only next page  
- No full-collection download on open  
- Filters/search/sort correct across **entire** dataset  
- Counts portfolio-wide, not page-local  
- No duplicate/missing rows from unstable order  
- Page-2 failure does not wipe page-1  
- Export remains separate and authorized  
- Auth still JWT host-scoped  

Latency SLOs: **not invented** (none found as project constants in this audit).

---

## 26. Risks

### High

- Shipping pagination while leaving filter/search/sort client-side → **wrong empty states**  
- Unstable `ORDER BY created_at` alone → dups/skips  
- AuthZ mistakes in new query builders  
- Ops sort complexity on server  

### Medium

- Count query cost; export memory; scroll races; mobile flaky network  

### Low

- Loading indicators; empty copy  

---

## 27. Evidence / Source Index

| Area | Path |
| ---- | ---- |
| Bookings route | `nexastays_web/app/[locale]/host/(portal)/(content)/bookings/page.tsx` |
| Listings route | `nexastays_web/app/[locale]/host/(portal)/(content)/listings/page.tsx` |
| Bookings composer | `components/host/bookings/HostBookingsPage.tsx` |
| Bookings list | `components/host/bookings/HostBookingsList.tsx` |
| Booking card | `components/host/bookings/HostBookingCard.tsx` |
| Listings composer | `components/host/listings/HostListingsPage.tsx` |
| Listing card | `components/host/listings/HostListingCard.tsx` |
| Booking helpers | `lib/host-booking-center.ts` |
| Listing helpers | `lib/host-listings-center.ts` |
| API client | `lib/stays-api.ts` |
| Controller | `backend/stays/src/modules/stays/stays.controller.ts` |
| Bookings service | `backend/stays/src/modules/stays/stays.service.ts` (`getHostBookings`, `exportHostBookingsCsv`, `toBookingResponse`) |
| Listings service | `backend/stays/src/modules/stays/services/host-listings.service.ts` |
| Migrations | `database/stays/migrations/001_*.sql`, `003_*.sql`, `017_*.sql`, … |
| Reviews pagination precedent | `lib/host-reviews.ts`, `listHostReviews` |

---

## 28. Final Verdict

### `READY WITH RISKS`

Architecture is fully traced end-to-end. Implementation path is clear. Main risks are **semantic** (must move filters/search/sort/counts server-side with pagination) and **ordering stability** (must add `id` tie-break / keyset), not missing evidence.

| Change | Classification |
| ------ | -------------- |
| Server-side booking pagination | **REQUIRED** |
| Server-side listing pagination | **REQUIRED** |
| Server-side filter/search/sort (both) | **REQUIRED** |
| Stable ORDER BY + id | **REQUIRED** |
| Portfolio counts in API | **REQUIRED** |
| Cursor/keyset pagination | **REQUIRED** (preferred) |
| IntersectionObserver incremental load | **RECOMMENDED** |
| Explicit Load More fallback | **RECOMMENDED** |
| Slim list payload / cover_media | **REQUIRED** for listings; **RECOMMENDED** for bookings embed |
| Drop booking list listing.media join | **RECOMMENDED** |
| New indexes `(host_user_id, created_at, id)` style | **RECOMMENDED** (implement with P1) |
| Server-side export streaming | **OPTIONAL** (later) |
| Redis cache of host lists | **NOT NEEDED** |
| Fake client infinite scroll over full download | **NOT NEEDED / FORBIDDEN** |

---

**STOP — await implementation approval.**

No pagination, infinite scroll, API, UI, or database changes were implemented in this audit turn.

---

## Appendix A — Implementation EXPLAIN notes (2026-08-12)

Measured locally with `EXPLAIN (ANALYZE, BUFFERS)` against stays DB (~1010 listings, ~222 bookings):

| Query | Before | After `035_host_list_pagination_indexes.sql` |
| ----- | ------ | --------------------------------------------- |
| Listings `WHERE host_user_id ORDER BY created_at DESC, id DESC LIMIT 21` | Seq Scan + Sort (~0.43ms) | Index Only Scan on `idx_stays_listings_host_created_id` (~0.41ms) |
| Bookings join host + `ORDER BY created_at DESC, id DESC LIMIT 21` | Hash Join + Sort (~0.80ms) | Listings side uses new host index; bookings table still Seq Scan at current cardinality (~0.41ms) |

Indexes added (justified — not speculative search/trigram):

- `idx_stays_bookings_listing_created_id (listing_id, created_at DESC, id DESC)`
- `idx_stays_listings_host_created_id (host_user_id, created_at DESC, id DESC)`

Counts remain on separate endpoints (not folded into list).
