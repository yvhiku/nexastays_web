# H7 — Host Property Performance Audit

**Status:** AUDIT COMPLETE / IMPLEMENTATION NOT STARTED  
**Scope:** Read-only feasibility of per-listing performance for hosts  
**Does not authorize:** API implementation, UI, migrations, occupancy rewrite, charts, CMI, payout settlement  

**Upstream:**

- [H1 — Host Dashboard Spec](./H1_HOST_DASHBOARD_SPEC.md)
- [H2 — Data Contract](./H2_HOST_DASHBOARD_DATA_CONTRACT.md)
- [H3 — Host Dashboard API](../../../backend/stays/docs/host-dashboard-api.md)
- [H4 — UX Architecture](./H4_HOST_DASHBOARD_UX_ARCHITECTURE.md)
- Inventory: [host-dashboard.md](../host-dashboard.md)

> H1 named “H7 = Property performance.” H4 remapped implementation numbering so UI **earnings/payout** became H7 and **property performance** became H8.  
> **This document is the H7 product audit** answering: *which properties perform well, which need attention, and why?*  
> It does **not** change H1–H6 files or ship code.

---

## 1. Executive verdict

**Nexa can authoritatively answer property-level performance from existing data**, but **not from `GET /stays/host/dashboard` alone**.

| Area | Verdict |
| ---- | ------- |
| Ownership / AuthZ | Strong — JWT `sub` → `listings.host_user_id`; no client `hostId` |
| Booking counts / ops by listing | Feasible — `GET /stays/host/bookings` returns `listing_id` + status + dates |
| Money by listing (H3 formulas) | Feasible — booking money fields exist; same earning statuses |
| Host-aggregate occupancy (H3) | Exists on dashboard; **per-listing ≠ same formula** |
| True available-night occupancy | **Not** available (blocks ignored; same H3 limitation) |
| Reviews per listing | Partial — denorm on listing entity; host list API omits ratings; `listHostReviews` has `listing_id` but host-level summary only |
| Listing health / completion | Strong per listing via `GET /stays/host/listings` |
| Calendar health per listing | Available via external-calendar APIs (`listing_id` + status) |
| `GET /stays/host/analytics` | **Does not exist** (H3 non-goal; H2 shape only) |
| H3 dashboard `by_listing` | **Does not exist** — aggregates only |

**Final API decision (locked below §12 / §24):**

# H7 API: CREATE /stays/host/analytics

Keep `GET /stays/host/dashboard` as the ops/money **snapshot**. Add a dedicated analytics endpoint for per-property breakdowns and future periods — without inventing metrics outside H3 money/status rules.

---

## 2. Current property data model

### Listing entity (`stays_listings`)

**Source:** [`stays-listing.entity.ts`](../../../backend/stays/src/modules/stays/entities/stays-listing.entity.ts)

| Field | Role |
| ----- | ---- |
| `id` | Listing UUID |
| `host_user_id` | Authoritative owner (Identity JWT `sub`) |
| `title`, `city`, … | Identity / location |
| `status` | `DRAFT \| SUBMITTED \| APPROVED \| REJECTED \| LIVE \| PAUSED` |
| `avg_rating`, `review_count`, `ratings_1`…`5` | Denormalized review aggregates |
| `archived_at`, `last_edited_at` | Lifecycle |

Completion is **computed** (not stored columns) in host listings:

- `completion_flags`, `completion_percentage`, `missing[]`  
  **Source:** `host-listings.service.ts` → `completionPayload` / `listing-completion.ts`

### Booking entity (`stays_bookings`)

| Field | Role |
| ----- | ---- |
| `listing_id` | Property link (indexed) |
| `status` | Lifecycle enum (see §4) |
| `checkin_date`, `checkout_date` | Date-only stay window |
| `total_subtotal`, `guest_fee`, `host_fee`, `total_paid`, `payout_amount`, `currency` | Money |
| `confirmed_at`, `created_at` | Month attribution inputs (H3) |

### Related entities

| Entity | Link | Notes |
| ------ | ---- | ----- |
| `stays_listing_reviews` | `listing_id` | Statuses include `PUBLISHED` (host list filters published) |
| `stays_external_calendars` | `listing_id` | `ACTIVE \| SYNCING \| ERROR \| PAUSED` |
| `stays_availability_blocks` | `listing_id` + `date` | Used for booking availability — **not** H3 occupancy |
| `stays_ledger_entries` | `booking_id` only | `HOST_PAYOUT`; listing via booking join |

### Host surfaces today

| API | Per-listing? |
| --- | ------------ |
| `GET /stays/host/listings` | Yes — status, completion, missing |
| `GET /stays/host/bookings` | Yes — each row has `listing_id` + money |
| `GET /stays/host/reviews` | Rows have `listing_id`; **summary is host-wide** |
| `GET /stays/host/dashboard` | **No** property array |
| `GET /stays/host/stats` | Legacy flat host-wide |
| External calendars per listing | Yes |
| Availability blocks POST | Yes (ops tooling) |

---

## 3. Ownership / authorization

| Question | Answer |
| -------- | ------ |
| Authoritative ownership | `stays_listings.host_user_id` |
| Dashboard / analytics scope | JWT `user.userId` only |
| Client `hostId` | **Must never exist** (H3/H4 lock; not present on host routes) |
| Mutation guard | `requireOwnedListing` → 403 if not owner |
| Host bookings query | `JOIN listing WHERE listing.host_user_id = :userId` |
| Isolation | Another host’s listings/bookings cannot enter those queries |

**P0 confirmation:** Property analytics must reuse the same JWT → `host_user_id` pattern. No client-owned identifier.

---

## 4. Booking performance audit

**Authoritative statuses** ([`stays-booking.entity.ts`](../../../backend/stays/src/modules/stays/entities/stays-booking.entity.ts)):

`INITIATED | PAYMENT_PENDING | CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED_BY_GUEST | CANCELLED_BY_HOST | EXPIRED`

Align presentation filters with H6 / H3:

| Metric | Definition | Eligible statuses / rule | Available from existing bookings load? |
| ------ | ---------- | ------------------------ | -------------------------------------- |
| Booking count | All bookings on listing | All statuses | Yes |
| Confirmed+ stay cohort | Paid / stay pipeline | `CONFIRMED \| CHECKED_IN \| COMPLETED` | Yes |
| Payment-pending count | Awaiting payment | `INITIATED \| PAYMENT_PENDING` | Yes |
| Upcoming count | Future check-in, stay active | `CONFIRMED \| CHECKED_IN` ∧ check-in > Casablanca today | Yes |
| Current / staying | In-house | `CONFIRMED \| CHECKED_IN` ∧ check-in ≤ today < checkout | Yes (H3 rule) |
| Completed count | Finished stays | `COMPLETED` | Yes |
| Cancelled count | Exit / expiry | `CANCELLED_BY_GUEST \| CANCELLED_BY_HOST \| EXPIRED` | Yes |
| Check-ins today | Ops | Stay statuses ∧ check-in = today | Yes |
| Check-outs today | Ops | Stay/completed statuses ∧ checkout = today | Yes (H3 includes `COMPLETED`) |

Do **not** invent new statuses. Labels may localize; enums stay unchanged.

---

## 5. Night / occupancy audit

### Booked nights

**Existing helper logic:** stay nights = check-in inclusive, check-out exclusive (same as web `bookingNights` / H3 `bookedNightsInCalendarMonth`).

| Concern | Rule |
| ------- | ---- |
| Timezone for “today/month” | `Africa/Casablanca` (H3) |
| Date columns | Calendar dates — not browser local |
| Same-day in/out | 0 nights if checkout ≤ check-in |
| Earning nights for occupancy | Use earning-status bookings for money; for “booked nights” H3 occupancy loops earning statuses |
| Payment-pending | **Excluded** from H3 money & booked-night occupancy loops |
| Cancelled / expired | Excluded from earning/occupancy nights |
| Availability blocks | **Ignored** in H3 occupancy |
| External ICAL busy | **Ignored** in H3 occupancy |

### H3 host occupancy

```text
BOOKED_OVER_CAPACITY_V1 =
  booked nights (earning bookings, month)
  / (days_in_month × max(live_listings, 1))
```

### Per-listing interpretation (proposed **without** changing H3 aggregate)

Do **not** reuse the name `BOOKED_OVER_CAPACITY_V1` for a single listing if the denominator is not “days × live listings across the host.”

| Scope | Basis label | Formula |
| ----- | ----------- | ------- |
| Host aggregate (H3) | `BOOKED_OVER_CAPACITY_V1` | nights / (days × max(live,1)) |
| Per listing (H7 proposal) | `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1` | listing booked nights in period / days_in_period |

For a **LIVE** listing, days_in_period ≈ days_in_month for “this month.”  
For non-LIVE listings, either omit occupancy or show booked nights only (no fake “available”).

**Not “true occupancy.”** Blocks/ICAL must stay out until a later occupancy rewrite.

---

## 6. Financial performance audit

Apply **exact H3 rules** per `listing_id` group:

| Field | Formula | Eligible |
| ----- | ------- | -------- |
| `gross_revenue` | Σ `total_paid` | `CONFIRMED \| CHECKED_IN \| COMPLETED` |
| `net_host_earnings` | Σ `payout_amount` else `max(0, total_subtotal − host_fee)` | same |
| `platform_fees` | Σ `guest_fee + host_fee` | same |
| Month attribution | Casablanca day of `confirmed_at ?? created_at` | same |
| `upcoming_revenue_30d` | net for `CONFIRMED \| CHECKED_IN` with check-in ∈ `[today, today+30)` | same |

| Pending / paid-out | Source | Per listing? |
| ------------------ | ------ | ------------ |
| Pending host payout | Ledger `HOST_PAYOUT` + `PENDING` join booking→listing | Feasible via join (not on booking alone) |
| Settled paid_out | `HOST_PAYOUT` + `SETTLED` | Feasible; typically 0 |
| Available wallet | Always 0 today | Do not invent |

**H3-compatible:** Yes — same formulas, scoped by `listing_id`.

---

## 7. Reviews audit

| Signal | Source | Per listing today? |
| ------ | ------ | ------------------ |
| avg / count denorm | Listing columns `avg_rating`, `review_count` | In DB; **not** on `HostListingSummary` |
| Published reviews list | `GET /stays/host/reviews` | Rows include `listing_id`, `listing_title`, `rating` |
| Host summary avg | `listHostReviews` summary | Host-wide only |
| Distribution | Summary distribution from denorm histograms | Host-wide |
| Latest N per listing | Possible by filtering list client-side (paged) | Awkward / incomplete without dedicated query |
| Unanswered / reply | Not supported | Do not invent (H4 lock) |

**Gap:** Host listing API omitting denorm ratings forces either (a) expose `avg_rating`/`review_count` on listings summary later, or (b) aggregate from reviews list / dashboard analytics join on listing entities in one query.

**N+1 today:** `listHostReviews` already loops `findOne` per listing id for summary — known smell; analytics must **not** copy that pattern.

---

## 8. Operational health audit

| Signal | Per listing available? | Source |
| ------ | ---------------------- | ------ |
| Status LIVE/PAUSED/DRAFT/… | Yes | `getHostListings` |
| Completion % / missing | Yes | same |
| Photos complete | Yes | `completion_flags` |
| Calendar ERROR / synced | Yes | external calendars by `listing_id` |
| Aggregate calendar chip | Yes | `dashboard.calendar_status` (host) |
| Aggregate listing_health | Yes | host rollup only |
| Verification host-level | Host verification gate | Not per listing Sumsub |
| Composite health score | **No** — do not invent | Use attention flags from existing signals |

**Actionable attention states (no new score):**

- `LIVE` missing required fields  
- Calendar `ERROR`  
- `PAUSED` / `REJECTED` / `DRAFT` incomplete  
- High cancel rate / payment pending pile (derived from bookings)

---

## 9. Upcoming performance audit

From bookings + Casablanca today (same as H3/H6):

| Metric | Available per listing? |
| ------ | ---------------------- |
| Next check-in | Yes — min future check-in |
| Next checkout | Yes — among staying/upcoming |
| Upcoming booking count | Yes |
| Upcoming 30d net revenue | Yes (H3 formula scoped) |
| Currently staying guests | Yes (count of staying bookings) |
| Guest display name | Yes when `guest_name` present on host bookings |

---

## 10. H3 compatibility matrix

| H7 Metric | In H3 response? | Existing source | Derivable client-side from H3 alone? | Backend aggregation required? |
| --------- | --------------- | --------------- | ------------------------------------ | ----------------------------- |
| Property identity (id, title, status) | No | `GET /stays/host/listings` | No | Prefer include in analytics |
| Booking counts by status | No | `GET /stays/host/bookings` | No (need bookings, not H3) | Optional in analytics |
| Per-listing gross/net/fees | No | bookings money fields | Partial if client loads all bookings + H3 rules | **Preferred in analytics** |
| Per-listing booked nights | No | booking dates | Same | Preferred in analytics |
| Per-listing occupancy basis | No | — | Not from H3 | Yes (propose `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1`) |
| Host occupancy `BOOKED_OVER_CAPACITY_V1` | Yes | `inventory.*` | N/A | Already H3 |
| This-month net (host) | Yes | `earnings.this_month` | N/A | Already H3 |
| Pending payout (host) | Yes | `payouts.pending` | N/A | Already H3 |
| Pending payout (per listing) | No | ledger join | No | Analytics join |
| Reviews avg/count (host) | Yes | `reviews.*` | N/A | Already H3 |
| Reviews avg/count (per listing) | No | listing denorm / reviews API | No from H3 | Yes (single listing select) |
| Listing completion | No | listings API | No from H3 | Include from listings load |
| Calendar ERROR per listing | No | calendars API | No from H3 | One calendars `In(listingIds)` |
| Messaging unread | No / unavailable | — | Forbidden | — |
| ADR | No | — | Forbidden until field exists | — |
| Charts / series | No | — | Forbidden in H5/H6 | Future analytics |

**Conservative rule:** If it is not on H3, mark “not available from H3” even when other host APIs could supply it.

---

## 11. N+1 / scalability audit

### Current safe pattern (H3)

1. Load listings for `host_user_id`  
2. Load bookings `listing_id IN (...)`  
3. One ledger join for host payouts  
4. One calendars `In(listingIds)`  
5. Reviews summary call (internally imperfect)  
6. In-memory loops  

### Dangerous patterns for H7

| Pattern | Risk |
| ------- | ---- |
| 1 bookings query per listing | N+1 |
| 1 reviews query per listing | N+1 |
| 1 calendar query per listing | N+1 |
| Copy `listHostReviews` per-listing `findOne` loop | Known N+1 |

### Recommended aggregation strategy (do not implement)

1. **One** listings query (id, title, status, avg_rating, review_count, …)  
2. **One** bookings query for those ids (already indexed on `listing_id`)  
3. **One** calendars query `In(listingIds)`  
4. **Optional one** ledger query join booking→listing, group by `listing_id`  
5. In-memory `Map<listing_id, Accumulators>` using H3 formulas  
6. Attach completion from listings load (already computed)  

Indexes already help: `idx_stays_bookings_listing`, composite `(listing_id, checkin, checkout, status)`.

**Scale note:** Acceptable for dogfood/small portfolios (same H3 in-memory premise). SQL `GROUP BY listing_id` deferred when host booking volume warrants.

---

## 12. Recommended API architecture

### Option A — Extend `GET /stays/host/dashboard`

Pros: reuse current load; one round-trip for H5 page.  
Cons: bloats ops snapshot; couples property analytics to every dashboard open; period filters/charts don’t fit; fights H3 “analytics non-goal” spirit; mobile ops ATF pays for unused property arrays.

### Option B — Create `GET /stays/host/analytics`

Pros: matches H2 §9 direction; keeps dashboard ops/money lean (H4/H5); natural home for `period`, property list, later series/filters; cacheable independently; back-compat on `/dashboard` and `/stats`.  
Cons: second authenticated call when user opens Properties performance UI.

### Recommendation

**CREATE `/stays/host/analytics`.**

Reasoning: property performance is a different host **job** than operate-today. H3 already closed the aggregate snapshot; H2 reserved analytics for per-property. Extending the dashboard would re-introduce clutter H5 removed and force payload growth on every host load.

**Interim (non-goal for API):** a UI could tentatively group `getHostBookings` client-side, but that is **not** the contract and must not dual-truth month attribution vs Casablanca helpers.

---

## 13. Proposed future API contract (DOCUMENT ONLY — NOT IMPLEMENTED)

```http
GET /stays/host/analytics?period=this_month
Authorization: Bearer <JWT>
```

**AuthZ:** JWT `sub` only — never `hostId`.

**Query (v1):**

| Param | Values (v1) | Notes |
| ----- | ----------- | ----- |
| `period` | `this_month` \| `previous_month` \| `all_time` \| `next_30d` | Casablanca calendar |
| Optional later | `from`/`to`, `listing_id` | Out of v1 |

**Response shape (conceptual):**

```json
{
  "as_of": "2026-08-11T18:00:00.000Z",
  "timezone": "Africa/Casablanca",
  "currency": "MAD",
  "period": {
    "id": "this_month",
    "start": "2026-08-01",
    "end_exclusive": "2026-09-01"
  },
  "eligible_booking_statuses": ["CONFIRMED", "CHECKED_IN", "COMPLETED"],
  "properties": [
    {
      "listing_id": "uuid",
      "title": "string",
      "city": "string",
      "status": "LIVE",
      "bookings": {
        "total": 0,
        "payment_pending": 0,
        "upcoming": 0,
        "current": 0,
        "completed": 0,
        "cancelled": 0
      },
      "nights": {
        "booked_in_period": 0
      },
      "earnings": {
        "gross_revenue": 0,
        "net_host_earnings": 0,
        "platform_fees": 0,
        "upcoming_revenue_30d": 0
      },
      "occupancy": {
        "value": 0,
        "basis": "BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1"
      },
      "reviews": {
        "avg_rating": null,
        "total_reviews": 0
      },
      "operations": {
        "checkins_today": 0,
        "checkouts_today": 0,
        "next_checkin_date": null,
        "upcoming_bookings": 0,
        "currently_staying": 0
      },
      "payouts": {
        "pending": 0,
        "paid_out": 0
      },
      "health": {
        "completion_percentage": 0,
        "photos_complete": false,
        "calendar_status": "NONE",
        "missing": [{ "code": "string", "label": "string" }],
        "attention": []
      }
    }
  ]
}
```

**Semantics locks:**

- Money = H3 formulas + earning statuses.  
- `period` for earnings attribution uses `confirmed_at ?? created_at` in Casablanca for `this_month` / `previous_month` / `all_time`.  
- `next_30d` earnings use check-in window (same as H3 upcoming).  
- Occupancy basis **must** be `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1` (not host `BOOKED_OVER_CAPACITY_V1`).  
- No ADR. No messaging. No withdraw balance. No fake sample properties.

---

## 14. Recommended UX architecture (audit only)

**Primary pattern:** ranked / sortable **property cards** with a **“Needs attention”** group above healthy LIVE properties.

| Priority | Content |
| -------- | ------- |
| 1 | Identity: title, city, status badge |
| 2 | Operational: currently staying / check-in today / calendar ERROR |
| 3 | Performance: this-period net earnings (primary money) |
| 4 | Bookings: upcoming + completed counts |
| 5 | Occupancy: value + basis footnote |
| 6 | Reviews: avg + count (secondary) |
| 7 | Health: missing / photos / sync CTA → existing edit / calendar |

**Avoid:** comparison dashboard wall of charts (H4 rejected); fake radar scores; per-listing sparklines until series exist.

**Navigation:** cards deep-link to `/host/listings/[id]/edit` and Booking Center filtered by listing (when UI phase arrives). No new booking detail system.

---

## 15. Ranking options

Transparent sorts only — **no composite “best property” score**:

1. Highest `net_host_earnings` (period)  
2. Most bookings (period / all)  
3. Highest `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1`  
4. Highest `avg_rating` (nulls last)  
5. Highest `upcoming_revenue_30d`  
6. Needs attention first (calendar ERROR, incomplete LIVE, payment-pending stack)

Default dogfood sort: **needs attention**, then **net earnings**.

---

## 16. Data gaps and priorities

| ID | Gap | Class |
| -- | --- | ----- |
| G1 | No per-listing payload on H3 dashboard | P1 |
| G2 | No `/stays/host/analytics` | P1 |
| G3 | Host listing summary omits `avg_rating` / `review_count` | P1 |
| G4 | Occupancy cannot include blocks/ICAL | P2 (honesty required; rewrite later) |
| G5 | Ledger has no `listing_id` (join only) | P2 |
| G6 | `listHostReviews` N+1 listing fetches | P2 |
| G7 | No ADR field | P3 |
| G8 | No time series / charts | P3 |
| G9 | No unpaid wallet / available | P3 (mock honesty already) |
| G10 | Messaging unread unavailable | P3 |

No P0 AuthZ gap found on current host-scoped routes **if** analytics follows the same JWT pattern.

---

## 17. H7 implementation sequence (future — do not implement here)

1. **H7a — Contract freeze:** this audit + OpenAPI draft for `/stays/host/analytics`  
2. **H7b — Backend analytics service:** one listings + bookings (+ calendars/ledger) load; in-memory by `listing_id`; H3 money rules  
3. **H7c — Expose listing denorm ratings on host listings or analytics properties** (avoid N+1)  
4. **H7d — Web Properties performance section** consuming analytics (not inventing client KPI math)  
5. **H7e — Attention grouping + sorts**  
6. Later — period controls, then series/charts, then blocks-aware occupancy  

Keep `GET /stays/host/dashboard` unchanged during H7b unless a deliberate tiny cross-link field is added (not required).

---

## 18. Explicit non-goals

- Implementing APIs or UI in this phase  
- Changing H3 occupancy to include blocks  
- Inventing ADR, messaging unread, or wallet available  
- Client `hostId`  
- Modifying `/stays/host/stats` or `/stays/host/dashboard` contracts in this audit  
- Composite “best property” score  
- Editing H1–H6 documents beyond optional inventory cross-links (none required)

---

## 19. KPI matrix (authoritative checklist)

| Metric | Definition | Source of truth | Eligible statuses | Timezone | Available today? | H3 compatible? | Backend work required? | Priority |
| ------ | ---------- | --------------- | ----------------- | -------- | ---------------- | -------------- | ---------------------- | -------- |
| Listing identity | id, title, city, status | `stays_listings` / host listings | n/a | n/a | Yes (listings API) | Not in H3 | Low (include in analytics) | P1 |
| Bookings total | Count by listing | `stays_bookings` | all | n/a | Yes (bookings API) | Not in H3 | Low | P1 |
| Payment pending | Count | same | INITIATED, PAYMENT_PENDING | n/a | Yes | Not in H3 | Low | P1 |
| Upcoming | Count | same | CONFIRMED, CHECKED_IN + checkin>today | Casablanca | Yes | Not in H3 | Low | P1 |
| Current staying | Count | same | CONFIRMED, CHECKED_IN + overlap today | Casablanca | Yes | Not in H3 | Low | P1 |
| Completed | Count | same | COMPLETED | n/a | Yes | Not in H3 | Low | P1 |
| Cancelled | Count | same | CANCELLED_*, EXPIRED | n/a | Yes | Not in H3 | Low | P1 |
| Gross revenue | Σ total_paid | bookings | CONFIRMED, CHECKED_IN, COMPLETED | Month via Casablanca attr. | Derivable | Yes (formula) | Analytics group-by | P1 |
| Net host earnings | Σ payout/fallback | bookings | same | same | Derivable | Yes | Analytics group-by | P1 |
| Platform fees | Σ guest_fee+host_fee | bookings | same | same | Derivable | Yes | Analytics group-by | P1 |
| Upcoming revenue 30d | Net, check-in window | bookings | CONFIRMED, CHECKED_IN | Casablanca | Derivable | Yes | Analytics group-by | P1 |
| Booked nights in period | Exclusive checkout nights | booking dates | earning for H3 parity | Casablanca period | Derivable | Yes | Analytics | P1 |
| Occupancy value | nights / days_in_period | derived | earning nights | Casablanca | Not as named field | Basis must differ from host H3 | Analytics + labeling | P1 |
| Reviews avg/count | Denorm | listing columns | PUBLISHED via aggregate jobs | n/a | DB yes; host listing API no | Host only on H3 | Expose in analytics/listings | P1 |
| Calendar attention | ERROR etc. | external calendars | n/a | n/a | Yes (calendar APIs) | Aggregate only on H3 | One bulk query | P1 |
| Completion / missing | Computed flags | listings service | n/a | n/a | Yes | Aggregate only on H3 | Attach in analytics | P1 |
| Pending payout/listing | Σ HOST_PAYOUT PENDING | ledger⋈booking | PENDING | n/a | Join feasible | Host total on H3 | Analytics join | P2 |
| Host occupancy capacity form | H3 capacity | dashboard inventory | earning | Casablanca | Yes on H3 | Yes | None | — |
| ADR | revenue/nights | — | — | — | No | No | Future | P3 |
| Series/charts | time buckets | — | — | — | No | No | Future | P3 |

---

## 20. Final locked decision

# H7 API: CREATE /stays/host/analytics

**Why not extend `/stays/host/dashboard`?**

1. H3 dashboard is the **ops + money snapshot**; property performance is a separate host job.  
2. H2 already proposed `/analytics` for per-property / ranged KPIs.  
3. Extending the dashboard would bloat every H5 load (mobile ATF) with property arrays.  
4. Period selection (`this_month` / `previous_month` / `next_30d`) fits analytics, not the fixed Casablanca “as of now” snapshot.  
5. Backwards compatibility: leave `/dashboard` and `/stats` untouched while property analytics evolve.

**Next authorized phase (not this audit):** implement analytics contract + single host-scoped aggregation service using H3 money rules and `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1` labeling.
