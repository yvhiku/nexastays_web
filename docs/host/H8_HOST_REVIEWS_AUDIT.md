# H8 — Host Reviews Audit

**Status:** AUDIT COMPLETE / API DECISION LOCKED / IMPLEMENTATION NOT STARTED  
**Scope:** Read-only audit of guest→listing reviews for host understanding and future UX  
**Does not authorize:** UI, APIs, replies, migrations, fake unread, endpoint creation, H1–H7 edits  

**Upstream:** H1–H7 (especially H3 `reviews.*`, H4 reviews placement, H7 listing rating gap).

---

## 1. Executive verdict

| Question | Answer |
| -------- | ------ |
| Do reviews exist? | **Yes** — `stays_listing_reviews` + guest create/edit + public listing list + admin moderation |
| Can hosts list their reviews? | **Yes (backend)** — `GET /stays/host/reviews` returns PUBLISHED items + summary |
| Does the web host UI use that API? | **No** — no `getHostReviews` client; dashboard shows H3 avg/count only |
| Can hosts respond to reviews? | **No** — **Host review responses are not currently implemented** (no schema, service, or producer for `REVIEW_REPLY`) |
| Unread / needs-response? | **No authoritative state** — must not invent (same discipline as messaging unread) |
| Category / sub-ratings? | **Not stored** — public API returns empty `sub_ratings: {}` stub |
| AuthZ cross-host leak? | **No P0 found** — host list scoped by `listings.host_user_id = JWT sub` + `PUBLISHED` |
| H7 analytics? | Listing denorm `avg_rating` / `review_count` belong in analytics; reading text belongs on reviews API |

**Locked decision (see §19 / §24):**

# H8 API: USE EXISTING REVIEW APIs

Primary host reading surface already exists (`GET /stays/host/reviews`). Future work is wire + harden + expose listing denorm — **not** invent a reply system or a duplicate create-endpoint.

---

## 2. Review source-of-truth map

| Concern | Authoritative source |
| ------- | -------------------- |
| Review row | Entity `StaysListingReview` → table `stays_listing_reviews` |
| Media | `StaysReviewMedia` → `stays_review_media` |
| Listing aggregates | Listing columns `avg_rating`, `review_count`, `ratings_1`…`5` via `ReviewAggregateService` |
| Eligibility | `BookingLifecycleService.canReview` + `StaysReviewsService.assertCanReview` |
| Host list | `StaysReviewsService.listHostReviews` |
| Public listing list | `listListingReviews` |
| Moderation | Admin stays endpoints hide/publish/remove |
| Host dashboard KPI | H3 `reviews.avg_rating`, `reviews.total_reviews` (via `listHostReviews(…,1,1)` summary) |
| Event contract for reply | `@nexa/event-bus` `REVIEW_REPLY` — **never published by stays** |
| Web guest review UX | `/[locale]/bookings/[id]/review`, `RateStayContent` |
| Web host review inbox | **Missing** |

**Key files**

- `backend/stays/src/modules/stays/entities/stays-listing-review.entity.ts`
- `backend/stays/src/modules/stays/services/stays-reviews.service.ts`
- `backend/stays/src/modules/stays/reviews/reviews.controller.ts`
- `backend/stays/src/modules/stays/reviews/review-aggregate.service.ts`
- `backend/stays/src/modules/stays/stays.controller.ts` (`GET host/reviews`)
- `backend/stays/src/modules/stays/services/booking-lifecycle.service.ts`
- `database/stays/migrations/008_stays_listing_reviews.sql`, `013_stays_reviews_v2.sql`
- `nexastays_web/lib/stays-api.ts` (guest review methods only)
- `nexastays_web/components/host/HostBusinessSnapshot.tsx`

---

## 3. Review data model

| Field | Source | Nullable? | Authoritative? | Host-visible via API? | Exposed today |
| ----- | ------ | --------- | -------------- | --------------------- | ------------- |
| `id` | entity | no | yes | yes | host list `id` |
| `booking_id` | entity (unique) | no | yes | **no** on host list items | create path only for guest |
| `listing_id` | entity | no | yes | yes | host list |
| `guest_user_id` | entity | no | yes | **no** (UI uses display name only) | not on host list |
| `host_user_id` | entity | yes | denormalized | not used for host list filter | stored; list uses listing ownership |
| `rating` | entity decimal(2,1) | no | yes | yes | host / public |
| `comment` | entity text | yes | yes | yes | host (`''` if null) |
| `status` | `PUBLISHED\|HIDDEN\|REMOVED` | no | yes | host list = PUBLISHED only | admin sees all |
| `created_at` / `updated_at` | entity | no | yes | `created_at` yes | host list ISO |
| `edited_at` | entity | yes | yes | **no** on host list | guest detail yes |
| Title | — | — | — | — | **not stored** |
| Category / sub-ratings | — | — | — | stub `{}` on public | **not stored** |
| Host response text / at / author | — | — | — | — | **not implemented** |
| Media | `stays_review_media` | — | yes | public list yes; **host list no** | |

---

## 4. Ownership and authorization

| Check | Behavior |
| ----- | -------- |
| Host list scope | Listings where `host_user_id = JWT userId` → reviews `listing_id IN (…) AND status=PUBLISHED` |
| Client `hostId` | Not accepted |
| Create | Guest must own booking; cannot review own listing |
| Guest get by booking | Must be review’s `guest_user_id` |
| Public listing list | PUBLISHED only |
| Admin | Roles `ADMIN` hide/publish/remove |

### Security classification

| Issue | Class |
| ----- | ----- |
| Cross-host review text via host list | **No P0 found** (listing ownership filter) |
| JWT-only host reviews (no explicit “approved host” gate) | P2 — consistent with other host GETs; returns empty if no listings |
| Host list omits `status` (always published subset) | P2 — fine; do not imply host can see moderated queue |
| Summary N+1 `findOne` per listing | P2 performance |
| Denorm vs live count drift | P1 product correctness if aggregates stale |

---

## 5. Review eligibility lifecycle

Authoritative:

```text
Paid stay (CONFIRMED | CHECKED_IN | COMPLETED)
  → lifecycle COMPLETED (status COMPLETED OR today >= checkout)
  → canReview (not reviewing own listing)
  → assertCanReview (+ no existing review for booking_id)
  → createReview (status default PUBLISHED)
  → ReviewAggregateService recalculate listing
  → REVIEW_CREATED event
```

Additional rules:

- Guest must be booking guest.  
- Listing status ∈ `LIVE | PAUSED | APPROVED`.  
- Unique `booking_id` prevents duplicates.  
- On create, may promote `CONFIRMED|CHECKED_IN` → `COMPLETED` if lifecycle already completed.  
- Edit window: guest can edit within **48 hours** if not `REMOVED`.  
- **No separate review expiry window** beyond lifecycle COMPLETED.

Cancelled / expired / payment-pending bookings: **not eligible** (lifecycle ≠ COMPLETED).

---

## 6. Visibility / moderation lifecycle

| State | Meaning | Guest public | Host list | Admin |
| ----- | ------- | ------------ | --------- | ----- |
| `PUBLISHED` | Live review | Yes | Yes | Yes |
| `HIDDEN` | Admin-hidden | No | **No** | Yes |
| `REMOVED` | Soft-deleted | No | **No** | Yes |

Default on create: **PUBLISHED** (immediate — not a pending-moderation queue).

There is **no** host-visible “pending publication” state.

---

## 7. Host review summary

### Host as a whole

| Signal | Available today? | Notes |
| ------ | ---------------- | ----- |
| Average rating | Yes | H3 + `listHostReviews.summary.overall_avg_rating` (weighted from listing denorm) |
| Review count | Yes | H3 `total_reviews` / summary `total_count` (live PUBLISHED count) |
| Rating distribution % | Yes (API) | `distribution_pct` on host reviews summary — **not** on H3 dashboard payload |
| Reviews this / previous month | Derivable | Filter `created_at` Casablanca — **not exposed** as KPI |
| Latest review date | Derivable | First page `created_at` DESC — not a dedicated field |
| Pending / hidden counts | **No** for host | Host cannot query non-published |

### Per listing

| Signal | Available today? | Notes |
| ------ | ---------------- | ----- |
| avg_rating / review_count | In DB | **Omitted** from `HostListingSummary` (H7 gap) |
| Latest review text | Derivable | Filter host reviews by `listing_id` client-side (paged, incomplete) |
| Rating distribution | On listing denorm histograms | Not on host listing API |
| Category averages | **No** | Not stored |

---

## 8. Existing review APIs

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| POST | `/stays/reviews` | JWT | Guest create |
| POST | `/stays/bookings/:id/review` | JWT | Legacy create |
| GET | `/stays/bookings/:bookingId/review` | JWT | Guest own review |
| PATCH | `/stays/reviews/:id` | JWT | Guest edit |
| GET | `/stays/listings/:listingId/reviews` | Public | Listing reviews + summary |
| POST | `/stays/reviews/media/photo` | JWT | Upload |
| GET | `/stays/reviews/media/:assetId` | Public | Media if PUBLISHED |
| GET | `/stays/host/reviews?page&limit` | JWT | **Host list + summary** (page default 1, limit default 20, max 50) |
| GET/PATCH/DELETE | `/admin/stays/reviews…` | Admin | Moderation |

**Host list response (exact shape):**

```ts
{
  reviews: Array<{
    id: string;
    listing_id: string;
    listing_title: string;
    guest_name: string; // first name from occupant, else "Guest"
    rating: number;
    comment: string;
    created_at: string; // ISO
  }>;
  summary: {
    overall_avg_rating: number | null;
    total_count: number;
    distribution_pct: { '5': number; '4': number; '3': number; '2': number; '1': number };
  };
  page: number;
  limit: number;
  total: number;
}
```

**Filters/sort on host list today:** none beyond pagination + fixed `created_at DESC`.  
**Listing filter query param:** not supported (would be enhancement).

---

## 9. Existing host review capabilities

| Capability | State | Evidence |
| ---------- | ----- | -------- |
| See reviews | YES (API) / PARTIAL (web) | Backend host list; no web client |
| Filter by property | NO | No listing_id query on host list |
| Search | NO | — |
| Sort | PARTIAL | Fixed newest-first |
| Pagination | YES | page/limit |
| See date / rating / text | YES (API) | item fields |
| See guest identity | PARTIAL | First name only via `resolveGuestName` |
| Respond | **NO** | No fields/methods |
| Edit / delete response | **NO** | — |
| Report / flag | **NO** | — |
| Mark handled | **NO** | — |
| Dashboard avg/count | YES | H3 |

---

## 10. Host response / reply audit

Search across stays review code: **no** `reply`, `host_response`, `review_reply`, unanswered columns or services.

`EVENTS.REVIEW_REPLY` exists in event-bus / notifications mapping but **stays never publishes it**.

### Product implication

> **Host review responses are not currently implemented.**  
> Dashboard/action-center must **not** show “needs response,” “unanswered,” or reply composers until a schema + AuthZ + API exist.  
> H8/H4 discipline matches messaging: never invent attention counters.

---

## 11. H3 compatibility

H3 uses `listHostReviews(hostUserId, 1, 1)` and exposes:

- `reviews.avg_rating` ← summary `overall_avg_rating`  
- `reviews.total_reviews` ← summary `total_count`  

| Review requirement | H3 available? | Existing source | Derivable? | Backend work required? |
| ------------------ | ------------- | --------------- | ---------- | ---------------------- |
| Host avg rating | Yes | `reviews.avg_rating` | — | No |
| Host review count | Yes | `reviews.total_reviews` | — | No |
| Distribution | No | `GET /stays/host/reviews` summary | Via host reviews API | No (wire web) |
| Latest review text | No | host reviews page 1 | Yes | Wire web |
| Listing-level avg | No | listing denorm | Not from H3 | Include in listings/analytics |
| Review action items | No | — | No without reply/unread model | Future only |
| Review media on host | No | public listing path | — | Optional enhance |

**Do not modify H3** for management lists — keep snapshot lean.

---

## 12. H7 analytics compatibility

| Metric | Fits analytics? | Supported by data? |
| ------ | --------------- | ------------------ |
| Rating by property | Yes | listing `avg_rating` / `review_count` |
| Review volume by property | Yes | `review_count` |
| Rating trend / monthly volume | Partial | Derivable from review `created_at` with SQL later |
| Category ratings | No | Not stored |
| Response rate | No | No responses |

**Split:**  

- **H7 analytics** = property performance including **rating stats** (denorm).  
- **H8 reviews** = **reading** published review content (existing host list API).

---

## 13. Dashboard vs Analytics vs Reviews architecture

| Destination | Belongs |
| ----------- | ------- |
| **Dashboard** (`GET /stays/host/dashboard`) | Avg + count only; optional “View reviews” CTA — no text wall |
| **Analytics** (`GET /stays/host/analytics` — future H7) | Per-property `avg_rating`, `total_reviews` |
| **Reviews** (`GET /stays/host/reviews` — **exists**) | Paginated reading of published reviews; future filters |

Recommended eventual UX (not implemented):

1. Dashboard KPI chip → navigates to reviews reading surface  
2. Properties analytics card shows rating numbers  
3. Dedicated reviews panel/page consumes **existing** host reviews API  

---

## 14. Attention / notification model

| Concept | Exists? |
| ------- | ------- |
| Unread reviews | **No** |
| New-since cursor | **No** |
| Requires response | **No** (no replies) |
| Requires moderation (host) | **No** (admin-only; host never sees HIDDEN queue) |
| Notification event on create | Yes — `REVIEW_CREATED` → host can be notified via notification system |
| Authoritative unread count for dashboard | **None** — do **not** invent `unread_reviews` |

Inbox timeline has guest/host review *cards* for stay journey, not a host review management inbox.

---

## 15. Review KPI matrix

| Metric | Definition | Source | Visibility rules | TZ | Available today? | H3? | H7 analytics? | Backend work? | Priority |
| ------ | ---------- | ------ | ---------------- | -- | ---------------- | --- | ------------- | ------------- | -------- |
| Host avg rating | Weighted listing avgs | denorm / summary | PUBLISHED aggregates | n/a | Yes | Yes | Listing field | Low | P1 |
| Host review count | Σ PUBLISHED | live count / denorm | PUBLISHED | n/a | Yes | Yes | Yes | Low | P1 |
| Distribution | Star histogram % | listing ratings_* | PUBLISHED | n/a | Yes via host reviews | No | Optional | Wire | P2 |
| Latest review | Newest PUBLISHED row | reviews table | PUBLISHED | created_at UTC ISO | Yes via API | No | No | Wire web | P1 |
| Reviews this month | Count by created_at Casablanca | reviews | PUBLISHED | Casablanca | Derivable | No | Future | Enhance | P2 |
| Lowest/highest rated property | Min/max listing avg | denorm | LIVE+ with count>0 | n/a | Derivable | No | Analytics | Expose denorm | P2 |
| Response rate | responses/reviews | — | — | — | **No** | No | No | New system | P3 |
| Unread | — | — | — | — | **No** | Forbidden | No | — | — |

No composite “reputation score.”

---

## 16. Pagination / performance audit

| Topic | Finding |
| ----- | ------- |
| Defaults | page=1, limit=20 (controller/service); clamp 1–50 |
| Sort | `created_at DESC` only |
| Indexes | `(listing_id, created_at)`, `(listing_id, status)`, `booking_id` unique, guest index |
| Host list joins | listing + booking + occupants (for name) |
| N+1 | Summary loop `findOne` per listing id — **known** |
| Large comments | Up to 1000 chars; media not on host list (good for payload) |
| Dedicated endpoint needed? | **Already exists** — wire it; fix N+1 when enhancing |

Recommendation: next implementation pass should load listing denorm in **one** `In(listingIds)` query for summary, not per-id `findOne`.

---

## 17. Privacy / data exposure audit

| Data | Current host list behavior | Risk |
| ---- | -------------------------- | ---- |
| Guest display name | **First name** only (occupant full_name split) or `"Guest"` | Acceptable for public-style social proof |
| Email / phone / user id | **Not** on host review items | Good |
| Booking id | **Not** on host review items | Fine for reading; harder to deep-link booking |
| Full comment | Exposed | Intended |
| Internal moderation status | Not exposed to host | OK |
| Cross-host | Filtered by ownership | OK |

Product risk: first-name localization / empty occupant → generic `"Guest"` (may be untranslated in API string).

---

## 18. I18N / RTL audit

| Area | State |
| ---- | ----- |
| Guest review form | `rateStay.*` EN/FR/AR |
| Trips / leave review | `myBookings.*` |
| Dashboard avg/count | `hostDashboard.avgRating`, `reviewCount`, `noReviewsYet` |
| Host reviews inbox UI keys | **Missing** (`hostReviews.*` namespace does not exist) |
| Public listing reviews | Some hardcoded EN in `ListingReviewsSection` |
| RTL | Follows app locale; no host reviews page to validate yet |

Future UI must add EN/FR/AR + RTL list layout; out of scope for this audit file content beyond calling out the gap.

---

## 19. Recommended API architecture

Evaluated options:

| Option | Fit |
| ------ | --- |
| A — dashboard summary + analytics ratings + dedicated reviews | **Best** — and dedicated list **already exists** |
| B — all under `/analytics` | Wrong place for reading comment text |
| C — invent new host endpoint | Unnecessary duplicate of `GET /stays/host/reviews` |
| D — other | — |

**Responsibility split (locked):**

`GET /stays/host/dashboard`  
→ operational snapshot only (`reviews.avg_rating`, `reviews.total_reviews`)

`GET /stays/host/analytics` (H7; not implemented)  
→ property/historical performance including listing `avg_rating` / `review_count`

`GET /stays/host/reviews` (**existing**)  
→ review reading / management list (PUBLISHED), summary distribution

Optional later enhancements (not inventing replies):

- `listing_id` filter, search, sort query params  
- Include media on host items if product wants  
- Fix summary N+1  
- Expose denorm ratings on `GET /stays/host/listings`

---

## 20. Proposed future API contract

**Baseline:** keep existing `GET /stays/host/reviews` response as source of truth.

**Compatible enhancements (DOCUMENT ONLY — not implemented):**

```http
GET /stays/host/reviews?page=1&limit=20&listing_id=<optional>&sort=newest
Authorization: Bearer <JWT>
```

```json
{
  "reviews": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "listing_title": "string",
      "guest_name": "Sara",
      "rating": 4.5,
      "comment": "string",
      "created_at": "2026-08-01T12:00:00.000Z",
      "response": null
    }
  ],
  "summary": {
    "overall_avg_rating": 4.7,
    "total_count": 26,
    "distribution_pct": { "5": 0.6, "4": 0.3, "3": 0.1, "2": 0, "1": 0 }
  },
  "page": 1,
  "limit": 20,
  "total": 26
}
```

`response` remains **`null` forever** until a real reply system ships — do not populate faux objects.

Web must add:

```ts
getHostReviews(token, { page, limit, listing_id? })
```

---

## 21. Gaps and priorities

| ID | Gap | Priority |
| -- | --- | -------- |
| R1 | Web missing `getHostReviews` + host reviews UI | P1 |
| R2 | Host listing summary omits avg/count denorm | P1 (also H7) |
| R3 | Host list N+1 summary | P2 |
| R4 | No listing_id filter / search on host list | P2 |
| R5 | No host reply system | P3 (product later) |
| R6 | No unread / needs-response | — do not invent |
| R7 | Category ratings not stored | P3 |
| R8 | Host reviews i18n namespace missing | P1 with UI |
| R9 | Hardcoded EN on public listing reviews | P2 |

---

## 22. H8 implementation sequence (future — not this phase)

1. Document freeze (this audit)  
2. Add web API client `getHostReviews` matching existing contract  
3. Host Reviews reading UI (list + summary + empty states) EN/FR/AR  
4. Expose listing denorm ratings on listings and/or analytics  
5. Harden `listHostReviews` summary query (kill N+1); optional filters  
6. Only then: product design for **reply** (schema + AuthZ + events) — separate phase  

---

## 23. Explicit non-goals

- Implementing UI or APIs in this document delivery  
- Inventing host replies, unread counts, or pending-host queues  
- Changing H3, H7 analytics contract, occupancy, messaging  
- Modifying H1–H7 markdown  
- Creating fake reviews or sample data  
- Admin moderation redesign  

---

## Capability matrix

| Capability | Current state | Source | Authoritative? | H3 available? | H7 analytics? | New API required? | Priority |
| ---------- | ------------- | ------ | -------------- | ------------- | ------------- | ----------------- | -------- |
| Host rating summary | YES | host reviews summary / H3 | yes | YES | listing avgs | No | P1 |
| Listing rating summary | PARTIAL | listing denorm | yes | NO | YES (planned) | Expose field | P1 |
| Review list | YES API / NO web | `GET /stays/host/reviews` | yes | NO | NO | No (wire) | P1 |
| Review detail | PARTIAL | list items enough | yes | NO | NO | Optional | P2 |
| Review filtering | NO | — | — | NO | — | Enhance existing | P2 |
| Review search | NO | — | — | NO | — | Enhance | P2 |
| Review sorting | PARTIAL fixed | newest | yes | NO | — | Enhance | P2 |
| Review pagination | YES | page/limit | yes | NO | — | No | — |
| Latest review | DERIVABLE | page 1 | yes | NO | NO | Wire | P1 |
| Review response | **NO** | — | — | NO | NO | New system later | P3 |
| Edit response | NO | — | — | NO | NO | New | P3 |
| Delete response | NO | — | — | NO | NO | New | P3 |
| Review notification | PARTIAL | `REVIEW_CREATED` | yes | NO | — | Consume existing | P2 |
| Review unread state | **NO** | — | — | Forbidden invent | NO | — | — |
| Moderation visibility (host) | NO for HIDDEN | admin only | yes | NO | NO | Product decision | P3 |
| Review reporting | NO | — | — | NO | NO | New | P3 |
| Rating trends | NO | — | — | NO | Future | Analytics SQL | P3 |
| Rating distribution | YES API | summary | yes | NO | Optional | Wire | P2 |

---

## 24. Required API decision

# H8 API: USE EXISTING REVIEW APIs

**Reasoning**

1. `GET /stays/host/reviews` already provides paginated PUBLISHED reviews + host summary distribution.  
2. Creating another reviews endpoint would duplicate an authoritative contract.  
3. H3 correctly stays at avg/count snapshot.  
4. H7 analytics correctly owns per-property rating **stats** from listing denorm — not comment threads.  
5. Reply / unread are **not** available — locking “USE EXISTING” prevents inventing those surfaces as if they ship for free.

**Responsibility split**

- `GET /stays/host/dashboard` → operational summary only (`reviews.avg_rating`, `reviews.total_reviews`)  
- `GET /stays/host/analytics` → property/historical performance (incl. listing ratings)  
- `GET /stays/host/reviews` → review reading/management (existing)

---

**H8 complete:** AUDIT COMPLETE · API DECISION LOCKED · IMPLEMENTATION NOT STARTED
