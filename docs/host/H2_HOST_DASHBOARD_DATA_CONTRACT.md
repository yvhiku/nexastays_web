# H2 — Host Dashboard Data Contract

**Status:** AUDIT COMPLETE — H3 API implemented  
**Scope:** Read-only mapping of H1 KPIs → Stays backend + web stats  
**Upstream:** [H1 — Host Dashboard Audit & Specification](./H1_HOST_DASHBOARD_SPEC.md)  
**Inventory:** [Current host dashboard](../host-dashboard.md)  
**H3 implemented:** see `backend/stays/docs/host-dashboard-api.md` (`GET /stays/host/dashboard`). This H2 doc remains the contract audit; it is not rewritten to hide remaining gaps (analytics, wallet settlement, occupancy blocks, messaging unread).

> This document is an **authoritative data contract**.  
> Frontend redesign, migrations, and real payout settlement remain out of scope for H3.

---

## 1. Executive verdict

| Area | Finding |
| ---- | ------- |
| Source of truth today | Mostly `GET /stays/host/stats` via `HostDashboardService` |
| Money semantics | Stats expose **net host payout** (`payout_amount`), often labeled “earnings” |
| Gross revenue / platform fees as KPIs | **Not** on `/host/stats` (fields exist on bookings / ledger) |
| Check-outs today | **Missing** — only `checkouts_tomorrow` exists |
| Paid out / available payout | **No** wallet settlement; `HOST_PAYOUT` ledger stays `PENDING` |
| Occupancy | Partial: booked nights ÷ calendar capacity; **ignores** blocks |
| Timezone | Process/local OS day — **not** listing TZ or Africa/Casablanca |
| Host AuthZ | JWT `sub` → listings `host_user_id`; **no** client `hostId` |

**H3 blockers:** rename/net vs gross semantics, check-outs today, payout lifecycle, occupancy denominator, explicit timezone, per-listing analytics.

---

## 2. Authoritative enums

### 2.1 Booking status (`stays_bookings.status`)

| Status | Role |
| ------ | ---- |
| `INITIATED` | Pre-payment / early hold |
| `PAYMENT_PENDING` | Awaiting payment |
| `CONFIRMED` | Paid, before/at stay |
| `CHECKED_IN` | Mid-stay |
| `COMPLETED` | Stay finished |
| `CANCELLED_BY_GUEST` | Guest cancel |
| `CANCELLED_BY_HOST` | Host cancel |
| `EXPIRED` | Payment hold expired |

**Sources:**

- `backend/stays/src/modules/stays/entities/stays-booking.entity.ts`
- Inventory occupancy (`BOOKED_STATUSES`): `INITIATED`, `PAYMENT_PENDING`, `CONFIRMED`, `CHECKED_IN` in `stays-availability.service.ts`

**Host-stats buckets** (`host-dashboard.service.ts`):

| Bucket | Statuses |
| ------ | -------- |
| Earning | `CONFIRMED`, `CHECKED_IN`, `COMPLETED` |
| Pending payment | `INITIATED`, `PAYMENT_PENDING` |
| Active | `CONFIRMED`, `CHECKED_IN` |
| Cancelled count | `CANCELLED_BY_*`, `EXPIRED` |

**Derived lifecycle** (not DB): `UPCOMING` | `ACTIVE` | `COMPLETED` | `PENDING_PAYMENT` | `CANCELLED` | `EXPIRED` — `booking-lifecycle.service.ts`.

### 2.2 Payment intent status (`stays_payment_intents`)

`PENDING` | `SUCCEEDED` | `FAILED` | `CANCELLED`

### 2.3 Ledger (`stays_ledger_entries`)

| Type | Typical status on confirm |
| ---- | ------------------------- |
| `GUEST_PAYMENT` | `SETTLED` (= `total_paid`) |
| `PLATFORM_FEE` | `SETTLED` (= `guest_fee + host_fee`) |
| `HOST_PAYOUT` | **`PENDING`** (= `payout_amount`) |
| `REFUND` | as applicable |

Statuses: `PENDING` | `SETTLED` | `FAILED`  
**Gap:** no code path found that later sets `HOST_PAYOUT` → `SETTLED`.

---

## 3. Booking money fields (create-time, frozen)

Via `calculateFeesAuthoritative`:

| Field | Formula |
| ----- | ------- |
| `total_subtotal` | `base_price × nights` |
| `guest_fee` | round(subtotal × guest fee %) |
| `host_fee` | round(subtotal × host fee %) |
| `total_paid` | `subtotal + guest_fee` (guest pays) |
| `payout_amount` | `subtotal - host_fee` (host earns) |

Identity: `total_paid = payout_amount + guest_fee + host_fee`  
Platform fee (ledger) = `guest_fee + host_fee`

**Sources:** `platform-settings.service.ts`, `stays.service.ts` (create), `stays-payments.service.ts` (confirm)

---

## 4. Current host stats API

| Layer | Detail |
| ----- | ------ |
| Route | `GET /stays/host/stats` |
| Auth | `JwtAuthGuard` + `@CurrentUser()` → `user.userId` / JWT `sub` |
| Service | `HostDashboardService.getHostStats(hostUserId)` |
| Scope | Listings where `host_user_id = JWT sub`, then bookings for those listings |
| Web | `getHostStats` in `lib/stays-api.ts` |
| Fallback | `computeHostDashboardStats` if stats call fails |
| UI | `HostKpiSection`, `HostTodayActionCenter` |

**Security:** host identity is derived from the JWT. Never accept client `hostId`.

### Response fields today (abbreviated)

`total_earnings`, `this_month_earnings`, `previous_month_earnings`, `earnings_mom_pct`, `upcoming_revenue_30d`, `occupancy_pct_this_month`, `occupancy_mom_pct`, `avg_nightly_earnings`, `currency`, booking/listing counts, `avg_rating`, `total_reviews`, `upcoming_checkins`, `next_checkin_*`, `current_guests`, `checkins_today`, `checkouts_tomorrow`, `awaiting_guest_payment`, `pending_payout_amount`, `calendar_status`, `revenue_series_30d`, `listing_health`.

Typed as `HostDashboardStats` in `nexastays_web/lib/stays-types.ts`.

**Client/server skew:** backend month earnings use `confirmed_at ?? created_at`; client fallback uses **check-in month**.

---

## 5. Timezone rule (as implemented)

| Concern | Behavior |
| ------- | -------- |
| Stay dates | `date` columns; compared as **local calendar day of the Node/browser process** |
| “Today” | `startOfLocalDay(new Date())` on the server process |
| Listing timezone | **Not modeled** |
| Pricing nights | UTC-midnight night math in booking date utils |

**Contract decision for H3:** pin dashboard “today” to `Africa/Casablanca` (or explicit host preference) — do not leave process-local unspecified.

---

## 6. KPI matrix

Format: **KPI → definition in code → source → eligible statuses → timezone → available today? → gap for H3**

### Check-ins today

- **Definition:** bookings with check-in date = local today, statuses `CONFIRMED` | `CHECKED_IN`
- **Source:** `host-dashboard.service.ts` → `checkins_today`; UI `HostTodayActionCenter`
- **TZ:** process local
- **Available:** **yes**
- **H3 gap:** property/host TZ; optional check-in window rules

### Check-outs today

- **Definition:** **not implemented**
- **Source:** only `checkouts_tomorrow` (checkout date = local **tomorrow**)
- **Available:** **no**
- **H3 gap:** add `checkouts_today`; keep or rename tomorrow KPI

### Currently staying

- **Definition:** lifecycle `ACTIVE` (`today ∈ [checkin, checkout)`, paid)
- **Source:** `current_guests` via `BookingLifecycleService`
- **Available:** **yes**
- **H3 gap:** align DB `CHECKED_IN` vs calendar ACTIVE

### New bookings today

- **Available:** **no** on `/host/stats`
- **H3 gap:** define event (`created_at` vs `confirmed_at`); expose count

### Unread messages

- **Source:** messaging unread API elsewhere (`messages-api.ts`) — **not** host stats
- **Available:** **no** on host stats
- **H3 gap:** embed or omit with `unavailable`; never invent

### Gross revenue

- **Fields exist:** `total_paid` / `total_subtotal`
- **Stats:** not exposed as gross KPI (earnings = net payout)
- **Available:** **no** as KPI
- **H3 gap:** choose Σ `total_paid` vs Σ `total_subtotal` and document

### Platform fees

- **Ledger:** `PLATFORM_FEE` = guest_fee + host_fee; host CSV “Platform Commission” ≈ host_fee only
- **Stats:** not a KPI field
- **Available:** **partial** (data exists)
- **H3 gap:** contract must choose guest+host vs host-fee-only

### Net host earnings

- **Definition:** Σ `payout_amount` (else `max(0, total_subtotal - host_fee)`) over earning statuses
- **Source:** `total_earnings`, month fields
- **Eligible:** `CONFIRMED`, `CHECKED_IN`, `COMPLETED`
- **Available:** **yes** (labeled “Total earnings”)
- **H3 gap:** rename vs gross; align client fallback month attribution

### Pending payout

- **Definition:** Σ ledger `HOST_PAYOUT` where `status = PENDING`
- **Source:** `pending_payout_amount`
- **Available:** **yes** (backend); client fallback may force `null`
- **H3 gap:** SETTLED lifecycle; schedule

### Paid out

- **Would be:** Σ `HOST_PAYOUT` SETTLED — never populated
- **Available:** **no**
- **H3 gap:** settlement job + KPI

### Available payout

- **Concept:** none (no host wallet)
- **Available:** **no**
- **H3 gap:** define available vs pending vs holds; mock provider abstraction

### Occupancy

- **Definition (v1):** booked nights ÷ (days_in_month × live_listings), capped 100%
- **Source:** `occupancy_pct_this_month`
- **Eligible nights:** earning statuses only
- **Available:** **partial** (ignores availability blocks / external calendars)
- **H3 gap:** available nights − blocked − external busy

### ADR

- **UI label:** ADR; **field:** `avg_nightly_earnings` = month net earnings ÷ booked nights (**net host**, not guest ADR)
- **Available:** **partial**
- **H3 gap:** `adr_gross` vs `adr_net_host`

### Booking count

- **Source:** `total_bookings` + pending/active/completed/cancelled breakdowns
- **Available:** **yes**
- **H3 gap:** optional paid-only filter

### Average rating / review count

- **Source:** listing denorm ratings + `PUBLISHED` reviews via host reviews service
- **Available:** **yes**
- **H3 gap:** denorm vs live count consistency; response support (needs audit — responses not assumed)

### Revenue time series / sparkline

- **Source:** `revenue_series_30d` — net host payout attributed to **check-in date**
- **Available:** **yes**
- **H3 gap:** attribution event (confirm vs check-in vs stay nights); gross option; longer periods

### Listing health

- **Source:** `listing_health` + `calendar_status`
- **Available:** **yes**
- **H3 gap:** per-listing breakdown; actionable checklist items

### Per-property revenue / occupancy / ADR

- **Available:** **no** aggregate analytics API
- **H3 gap:** `GET /stays/host/analytics` by listing

---

## 7. Occupancy & blocks (related systems)

| System | Behavior |
| ------ | -------- |
| Dashboard occupancy | Capacity denominator; no blocks |
| Availability | `stays_availability_blocks.is_blocked` + overlapping booked statuses |
| Comment in host-dashboard | “Later: booked nights / available nights from calendars” |

---

## 8. Reviews & payouts (existence)

**Reviews:** entity `stays_listing_reviews` with `PUBLISHED` | `HIDDEN` | `REMOVED`; host list via `GET /stays/host/reviews`.

**Payout / wallet:**

- Booking `payout_amount` + ledger `HOST_PAYOUT` (`PENDING`)
- Host application flag `payout_setup_completed` only
- **No** host wallet, paid-out balance, available balance, or settlement job

**Dogfood mock contract (proposed — not implemented):**

```json
{
  "provider": "mock",
  "mode": "dogfood",
  "available": 0,
  "pending": 0,
  "paidOut": 0,
  "nextPayout": null,
  "disclaimer": "Test environment — payouts are simulated. No real money is transferred."
}
```

---

## 9. Proposed future API contracts (shapes only)

### `GET /stays/host/dashboard`

```json
{
  "as_of": "2026-08-11T17:00:00Z",
  "timezone": "Africa/Casablanca",
  "currency": "MAD",
  "today": {
    "checkins_today": 0,
    "checkouts_today": 0,
    "checkouts_tomorrow": 0,
    "currently_staying": 0,
    "new_bookings_today": 0,
    "awaiting_guest_payment": 0
  },
  "earnings": {
    "gross_revenue_all_time": 0,
    "net_host_earnings_all_time": 0,
    "platform_fees_all_time": 0,
    "this_month": {
      "gross_revenue": 0,
      "net_host_earnings": 0,
      "platform_fees": 0,
      "mom_pct": null
    },
    "upcoming_revenue_30d": 0
  },
  "payouts": {
    "provider": "mock",
    "mode": "dogfood",
    "pending": 0,
    "available": 0,
    "paid_out": 0,
    "currency": "MAD"
  },
  "operations": {
    "upcoming_checkins": 0,
    "next_checkin_date": null,
    "next_guest_name": null
  },
  "inventory": {
    "live_listings": 0,
    "pending_listings": 0,
    "total_listings": 0,
    "occupancy_pct_this_month": 0,
    "occupancy_basis": "BOOKED_OVER_CAPACITY_V1"
  },
  "reviews": {
    "avg_rating": null,
    "total_reviews": 0
  },
  "messaging": {
    "unread_count": null,
    "status": "unavailable"
  },
  "calendar_status": {
    "healthy": true,
    "listings_needing_attention": 0
  },
  "listing_health": {
    "verified_live": false,
    "calendar_synced": false,
    "photos_complete": false,
    "avg_completion_pct": 0,
    "missing": []
  },
  "bookings_summary": {
    "total": 0,
    "pending": 0,
    "active": 0,
    "completed": 0,
    "cancelled": 0
  }
}
```

### `GET /stays/host/analytics`

```json
{
  "as_of": "2026-08-11T17:00:00Z",
  "timezone": "Africa/Casablanca",
  "currency": "MAD",
  "range": { "from": "2026-07-13", "to": "2026-08-11", "grain": "day" },
  "filters": { "listing_id": null },
  "kpis": {
    "gross_revenue": 0,
    "net_host_earnings": 0,
    "platform_fees": 0,
    "booking_count": 0,
    "booked_nights": 0,
    "available_nights": 0,
    "blocked_nights": 0,
    "occupancy_pct": 0,
    "adr_gross": null,
    "adr_net_host": null
  },
  "series": {
    "revenue_net": [{ "date": "2026-07-13", "amount": 0 }],
    "revenue_gross": [{ "date": "2026-07-13", "amount": 0 }],
    "occupancy_pct": [{ "date": "2026-07-13", "value": 0 }]
  },
  "by_listing": [
    {
      "listing_id": "uuid",
      "title": "string",
      "gross_revenue": 0,
      "net_host_earnings": 0,
      "booked_nights": 0,
      "available_nights": 0,
      "occupancy_pct": 0,
      "adr_gross": null,
      "adr_net_host": null,
      "booking_count": 0,
      "avg_rating": null,
      "review_count": 0
    }
  ],
  "eligible_booking_statuses": ["CONFIRMED", "CHECKED_IN", "COMPLETED"]
}
```

---

## 10. Files cited

### Backend

- `backend/stays/src/modules/stays/stays.controller.ts`
- `backend/stays/src/modules/stays/services/host-dashboard.service.ts`
- `backend/stays/src/modules/stays/entities/stays-booking.entity.ts`
- `backend/stays/src/modules/stays/entities/stays-payment-intent.entity.ts`
- `backend/stays/src/modules/stays/entities/stays-ledger-entry.entity.ts`
- `backend/stays/src/modules/stays/entities/stays-listing-review.entity.ts`
- `backend/stays/src/modules/stays/entities/stays-availability-block.entity.ts`
- `backend/stays/src/modules/stays/services/booking-lifecycle.service.ts`
- `backend/stays/src/modules/stays/services/stays-availability.service.ts`
- `backend/stays/src/modules/stays/services/stays-reviews.service.ts`
- `backend/stays/src/modules/stays/payments/stays-payments.service.ts`
- `backend/stays/src/modules/stays/stays.service.ts`
- `backend/stays/src/modules/platform-settings/platform-settings.service.ts`
- `backend/stays/src/modules/identity-auth/identity-jwt.strategy.ts`

### Web

- `nexastays_web/lib/host-dashboard-stats.ts`
- `nexastays_web/lib/stays-types.ts`
- `nexastays_web/lib/stays-api.ts`
- `nexastays_web/components/host/HostKpiSection.tsx`
- `nexastays_web/components/host/HostTodayActionCenter.tsx`
- `nexastays_web/app/[locale]/host/dashboard/page.tsx`
- `nexastays_web/lib/messaging/messages-api.ts`

---

## 11. H3 readiness checklist

Decisions that must be locked before implementing aggregated APIs / UI:

1. **Naming:** “earnings” / “ADR” are net host metrics today — split gross vs net in the contract.
2. **Check-outs today** vs tomorrow-only field.
3. **Gross revenue + platform fees** formulas on the dashboard aggregate.
4. **Paid out / available** require settlement semantics (`HOST_PAYOUT` stuck at `PENDING`).
5. **Occupancy** move to available nights (blocks + calendars).
6. **Timezone** explicit (`Africa/Casablanca` recommended default).
7. **Per-listing analytics** and series attribution (confirm vs check-in vs stay nights).
8. **New bookings today** + **unread messages** include vs external/unavailable.
9. Align web fallback (`host-dashboard-stats.ts`) with backend before treating either alone as truth.

---

## 12. Explicit non-goals (H2)

- No Nest route or service changes
- No DB migrations
- No React dashboard redesign
- No payout settlement jobs
- No fake “paid” money in dogfood

**Next:** H4+ per H1 sequence (UI wiring to `/host/dashboard`, analytics, occupancy denominator, payout settlement) — see [host-dashboard-api.md](../../../backend/stays/docs/host-dashboard-api.md) for the H3 endpoint.
