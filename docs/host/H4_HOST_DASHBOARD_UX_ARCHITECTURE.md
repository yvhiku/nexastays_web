# H4 — Host Dashboard UX Architecture & Information Hierarchy

**Status:** AUDIT COMPLETE / IMPLEMENTATION NOT STARTED  
**Scope:** UX / IA contract for `/{locale}/host/dashboard` — design only  
**Does not authorize:** React redesign, route creation, API/schema changes, payout tables, CMI, or fake real-money settlement  

**Upstream:**

- [H1 — Host Dashboard Spec](./H1_HOST_DASHBOARD_SPEC.md) — five jobs, product intent  
- [H2 — Data Contract](./H2_HOST_DASHBOARD_DATA_CONTRACT.md) — KPI → field audit  
- [H3 — Host Dashboard API](../../../backend/stays/docs/host-dashboard-api.md) — `GET /stays/host/dashboard`  
- [Current inventory](../host-dashboard.md)

> This document is the **authoritative UX contract** before any React implementation.  
> H1 jobs and IA intent bind; H3 fields bind; this H4 locks presentation hierarchy and product UX decisions.  
> H1’s numbered step named “H4 = Booking operational center” is **remapped** below so this architecture layer does not collide with implementation phases.

---

## 1. Design principles

1. **Actionable over vanity** — Today’s work and payments-needing-attention beat glossy all-time totals and sparklines.
2. **Never invent unavailable data** — messaging unread, wallet “available,” CMI settlement, unanswered reviews, true ADR, per-listing revenue series.
3. **Money honesty** — Gross ≠ “earnings.” The primary money number is **net host earnings**.
4. **Occupancy honesty** — H3 basis is `BOOKED_OVER_CAPACITY_V1`; UI must not imply blocks-aware availability.
5. **One aggregate path for redesign** — Consume `GET /stays/host/dashboard`. Keep `GET /stays/host/stats` as legacy until migration completes; do not dual-truth month attribution.
6. **JWT host identity only** — Never accept client `hostId`.
7. **Dogfood payout clarity** — Always show provider/mode + disclaimer; never a Withdraw CTA that implies real bank settlement.
8. **Job-first IA** — Structure by the five host jobs, not by leftover component files (`HostKpiSection` is not the product model).

Timezone for all “today / this month” copy: **Africa/Casablanca** (H3). Surface `as_of` in a small “Updated …” affordance; do not invent a second local TZ on the client for KPI boundaries.

---

## 2. Five host jobs

| Job | Host question | Primary dashboard answer |
| --- | ------------- | ------------------------ |
| **1. OPERATE TODAY** | What needs my attention right now? | Today strip + Action Center |
| **2. MANAGE BOOKINGS** | Who is arriving, leaving, staying, waiting, cancelled? | Booking Center |
| **3. UNDERSTAND BUSINESS** | How is my hosting business performing? | Compact business strip (Tier 2) + later analytics |
| **4. MANAGE PROPERTIES** | Are listings healthy, live, available, performing? | Properties summary + listing health |
| **5. MANAGE MONEY** | What did I earn, what is pending, how do I get paid? | Earnings + mock payouts panel |

Jobs are **not** equal in vertical priority. Operate + Money clarity beat Property vanity and charts.

---

## 3. Information hierarchy (global)

### Priority tiers

| Priority | Purpose | Placement |
| -------- | ------- | --------- |
| **P0 — Above the fold** | 5-second situational awareness | Header, Today strip, Action Center (if urgency), this-month **net** |
| **P1 — Primary work** | Do the day’s booking work | Booking Center |
| **P2 — Business + money context** | Understand health without vanity overwhelm | Earnings breakdown, payouts (honest mock), secondary KPIs |
| **P3 — Property & availability health** | Fix listing/calendar issues | Properties summary, calendar health CTA |
| **P4 — Social proof** | Reviews awareness | Rating summary (+ optional latest list later) |
| **P5 — Deferred** | Charts, dedicated analytics, dedicated route shells | After aggregate series / product promotes routes |

---

## 4. Global page architecture

Single page: `/{locale}/host/dashboard` (shell decision locked in §13).

```text
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│  Brand/host context · Greeting · Primary CTA                │
├─────────────────────────────────────────────────────────────┤
│ VERIFICATION GATE (if not APPROVED)                         │
│  Full dashboard body is not the primary story               │
├─────────────────────────────────────────────────────────────┤
│ TODAY — operational summary (P0)                            │
├─────────────────────────────────────────────────────────────┤
│ ACTION CENTER — prioritized attention list (P0 if items)    │
├─────────────────────────────────────────────────────────────┤
│ BUSINESS SNAPSHOT — this-month net + Tier 2 KPIs (P0/P2)    │
├─────────────────────────────────────────────────────────────┤
│ BOOKING CENTER (#host-bookings) (P1)                        │
├─────────────────────────────────────────────────────────────┤
│ EARNINGS + PAYOUTS (#host-money) (P2)                       │
├─────────────────────────────────────────────────────────────┤
│ PROPERTIES (#host-listings) (P3)                            │
├─────────────────────────────────────────────────────────────┤
│ CALENDAR / AVAILABILITY HEALTH (anchor to sync + blocks)(P3)│
├─────────────────────────────────────────────────────────────┤
│ REVIEWS SUMMARY (P4)                                        │
├─────────────────────────────────────────────────────────────┤
│ ALERTS / RESIDUAL HEALTH (only if not already in Action)    │
└─────────────────────────────────────────────────────────────┘
```

### Header

- **Greeting / context:** time-of-day greeting + host first name if available; timezone hint (“Today · Africa/Casablanca”).
- **Primary action (dynamic):**
  - If `today.checkins_today > 0` → **View today’s arrivals** (scroll/filter Booking Center to Check-in today).
  - Else if `inventory.total_listings === 0` → **Add listing**.
  - Else if critical listing health gaps → **Fix listing issues**.
  - Else → **Add listing** (secondary) + **View bookings**.
- **Secondary:** Home (guest explore), optional property filter **deferred** until multi-listing analytics exists (do not fake per-property filter that only cosmetic-filters empty data).

### What moves down vs today

Current UI ([`page.tsx`](../../app/[locale]/host/dashboard/page.tsx), `HostKpiSection`) puts revenue hero + sparkline + health above Action Center. H4 **inverts** that: operate first, then compact net, then bookings; demote all-time totals and charts.

---

## 5. Above-the-fold experience (5 seconds)

A host must understand without scrolling (desktop):

| Signal | Source | Meaning |
| ------ | ------ | ------- |
| Today’s check-ins | `today.checkins_today` | Arrivals to prepare |
| Today’s check-outs | `today.checkouts_today` | Departures / turnovers |
| Current guests | `today.currently_staying` | Who is in-house |
| Urgent payment issues | `today.awaiting_guest_payment` | Only emphasized if > 0 |
| This month’s earnings | `earnings.this_month.net_host_earnings` + `mom_pct` | What I keep this month |
| Primary CTA | Header rules above | One clear next move |

**Do not** put above the fold: all-time gross, 30d sparkline, CSV export chrome, raw listing admin tools, messages unread, ADR, occupancy as a huge vanity card without basis.

---

## 6. KPI hierarchy

Do **not** turn every H3 field into a KPI card.

### Tier 1 — Critical daily operational KPIs

| KPI | H3 field | UI treatment |
| --- | -------- | ------------ |
| Check-ins today | `today.checkins_today` | Today strip (always) |
| Check-outs today | `today.checkouts_today` | Today strip (always) |
| Currently staying | `today.currently_staying` | Today strip (always) |
| Awaiting guest payment | `today.awaiting_guest_payment` | Today strip **or** badge only when > 0 |
| This month net earnings | `earnings.this_month.net_host_earnings` | Compact money hero |
| MoM (net) | `earnings.this_month.mom_pct` | Badge on money hero (`null` → hide or “—”) |

### Tier 2 — Business performance KPIs

| KPI | H3 field | UI treatment |
| --- | -------- | ------------ |
| Pending payout | `payouts.pending` | Money secondary chip |
| Upcoming revenue (30d, net) | `earnings.upcoming_revenue_30d` | Supporting line |
| Occupancy this month | `inventory.occupancy_pct_this_month` | Secondary with **basis footnote** `BOOKED_OVER_CAPACITY_V1` |
| Live listings | `inventory.live_listings` | Small inventory chip |
| Check-outs tomorrow | `today.checkouts_tomorrow` | Action Center informational / Booking filter |
| Upcoming check-ins | `operations.upcoming_checkins` | Supporting ops line |
| Next guest | `operations.next_checkin_date`, `next_guest_name` | One-line preview |

### Tier 3 — Secondary health (not KPI cards)

| Metric | H3 field | Treatment |
| ------ | -------- | --------- |
| Avg rating / count | `reviews.avg_rating`, `total_reviews` | Reviews section |
| Calendar healthy | `calendar_status.*` | Chip + Action Center |
| Listing completion | `listing_health.*` | Properties / Action Center |
| New bookings today | `today.new_bookings_today` | Informational Action Center |
| Bookings summary counts | `bookings_summary.*` | Booking Center filter badges |
| Previous month net/gross/fees | `earnings.previous_month.*` | Earnings expand |
| All-time gross / net / fees | `earnings.*_all_time` | Earnings expand |
| This month gross / fees | `earnings.this_month.gross_revenue`, `platform_fees` | Earnings expand under net |
| Payout available / paid out | `payouts.available`, `paid_out` | Payouts panel (honest zeros) |
| Messaging | `messaging.*` | **Omitted** while `status: unavailable` |

### Forbidden KPI treatments (locked)

- Calling `gross_revenue*` “Your earnings.”
- Showing ADR (no true ADR on H3; do not rename `/stats` avg nightly to ADR).
- Messaging unread = 0 as a real empty inbox.
- Huge occupancy card without basis label.
- Sparkline as Tier 1 (H3 aggregate has **no** series).

---

## 7. Today / Action Center

### Purpose

Answer job 1: **What needs my attention right now?**

### Priority ordering (locked)

Show a row **only when count > 0** (except empty-state). Order:

1. **Check-ins today** → filter Booking Center `checkin_today`
2. **Check-outs today** → filter `checkout_today`
3. **Awaiting guest payment** → filter `awaiting_payment`
4. **Calendar issues** → `calendar_status.listings_needing_attention` → scroll `#host-calendar-sync`
5. **Listing problems** (critical gaps from `listing_health.missing` / incomplete photos / not live) → `#host-listings`
6. **Informational**
   - Check-outs tomorrow
   - New bookings today
   - Next upcoming guest (`operations.*`)

Severity tags:

- **Critical:** check-ins today, check-outs today, awaiting payment, calendar ERROR listings  
- **Important:** listing health blockers preventing live/bookable state  
- **Informational:** tomorrow, new bookings, next guest  

### Empty state

> You’re clear for today.  
> No check-ins, check-outs, or payments waiting.  
> Soft CTA: View upcoming bookings.

### Interaction rules

- Each row is actionable: apply Booking Center filter **or** scroll to calendar/listings.
- Do not list “all clear” fake rows for zero metrics.
- Do not include Messages while H3 messaging is unavailable.

---

## 8. Booking Center

### Purpose

Job 2: make arrivals/departures/stays/payments **obvious**.

### Data

- List: existing `GET /stays/host/bookings` (detail rows).
- Counts / day context: H3 `today.*`, `bookings_summary.*`, `operations.*`.
- Export: keep CSV as **secondary** control (collapsed or overflow), not above the list.

### Filters (locked)

| Filter id | Meaning | Backing logic (client derive; do not invent booking statuses) |
| --------- | ------- | ------------------------------------------------------------ |
| `all` | All host bookings | — |
| `arriving_soon` | Upcoming (lifecycle UPCOMING / check-in after today) | Lifecycle + dates |
| `checkin_today` | Check-in = Casablanca today | Match H3 check-in rule |
| `checkout_today` | Check-out = today | Match H3 check-out rule |
| `staying` | In-house | Match H3 currently staying |
| `awaiting_payment` | Pending payment | Lifecycle PENDING_PAYMENT |
| `completed` | Completed stays | Status COMPLETED |
| `cancelled` | Cancelled / expired | CANCELLED_* / EXPIRED |

Optional: listing filter when host has multiple listings (listing id from bookings payload).

Date filter: preset (upcoming 30d / this month) + optional from/to for export parity — defaults must not hide today’s ops.

### Booking row (minimum)

| Element | Notes |
| ------- | ----- |
| Guest display name | From occupants / existing host booking shape |
| Listing title | Short |
| Check-in → check-out | **Dominant** date pair; today matches get urgency chip |
| Status | Map DB status to host language (do not invent statuses) |
| Payment urgency | Chip when awaiting payment |
| Amount | Prefer **net host** when payout known; otherwise paid total labeled honestly |
| Quick actions | Open detail; optional copy dates — no fake “Confirm check-in” unless API exists |

Urgency indicators: `CHECK-IN TODAY`, `CHECK-OUT TODAY`, `STAYING`, `AWAITING PAYMENT` (color + text, not color alone).

### Detail navigation

→ Existing `/{locale}/bookings/[id]` host detail view. Do **not** invent a new booking modal unless product later requires it.

### Empty states

- Zero listings: prompt Add listing (Booking Center collapsed or muted).
- Zero bookings: “No bookings yet” + tip that confirmed stays appear after guest pays.
- Filter empty: “No bookings in this view” + reset to All.

---

## 9. Earnings

### Purpose

Job 5 (performance slice of job 3): clear money story without misleading labels.

### Primary number (locked)

**This month net host earnings** = `earnings.this_month.net_host_earnings`

**Why:** It is what the host keeps for the current Casablanca month, MoM-comparable via `mom_pct`, and matches H3 earning statuses. Gross is what guests paid; fees are platform cut — both must remain visible but secondary.

### Hierarchy

1. **Primary:** this-month net + MoM badge  
2. **Secondary (inline expand or two supporting figures):** this-month `gross_revenue`, `platform_fees`  
3. **Supporting:** `previous_month.net_host_earnings` (and expandable gross/fees); `upcoming_revenue_30d`  
4. **Drill / detail:** all-time gross / net / fees  

Copy rules:

- Label net as **Host earnings (net)** or **Your payout earnings**.  
- Label gross as **Guest payments (gross)** or **Gross revenue**.  
- Never show only gross in the hero.

Attribution footnote (once, near earnings): month attribution uses `confirmed_at ?? created_at` in Africa/Casablanca (H3).

---

## 10. Payouts (mock / dogfood UX)

### Purpose

Honest money-movement status **without** implying CMI settlement.

### Display fields

| UI label | H3 field | Behavior |
| -------- | -------- | -------- |
| Pending | `payouts.pending` | Sum of HOST_PAYOUT PENDING |
| Available | `payouts.available` | Always 0 today — label “Available (not enabled)” |
| Paid out | `payouts.paid_out` | SETTLED sum; usually 0 |
| Method | derived from `provider` + `mode` | Via abstraction below |
| Disclaimer | `payouts.disclaimer` | **Required**, always visible in panel |

### Forbidden UX

- “Withdraw now” / “Transfer to bank” when mock.  
- Green “Paid” celebrations on simulated ledgers.  
- Hiding disclaimer behind a tooltip only.  
- Treating `available: 0` as “you’re broke” rather than “wallet not enabled.”

### Payout-method abstraction (locked for future CMI)

```ts
type PayoutMethodDisplay = {
  provider: string;       // e.g. mock | cmi
  mode: string;           // e.g. dogfood | staging_mock | production
  title: string;          // host-facing method name
  status: 'simulated' | 'not_configured' | 'active' | 'unavailable';
  pending: number;
  available: number;
  paid_out: number;
  currency: string;
  disclaimer: string;     // from API when present; else safe default for simulated
  canWithdraw: false;     // remains false until real settlement exists
};
```

UI maps H3 `payouts` → `PayoutMethodDisplay`. When CMI arrives later, only the mapper + status labels change — panel layout stays.

---

## 11. Properties

### Purpose

Job 4: listing health & readiness — **summary**, not a second CRM.

### Dashboard content

From H3:

- `inventory.live_listings` / `pending_listings` / `total_listings`
- `listing_health` (verified_live, calendar_synced, photos_complete, avg_completion_pct, missing[])
- Host listings list (existing `GET /stays/host/listings`) for titles/status/pause/resume

Per listing row (dashboard-appropriate):

| Field | Available now? | Treatment |
| ----- | -------------- | --------- |
| Status (LIVE/DRAFT/…) | Yes (listings API) | Badge |
| Completion % / missing | Partial (listings summary + aggregate health) | Progress + top missing |
| Occupancy | **No** per-listing on H3 | Omit or “—” until analytics |
| Bookings count | No per-listing on H3 | Omit from aggregate card |
| Revenue | No per-listing on H3 | **Do not invent** |
| Reviews | Aggregate only on H3 | Skip per listing until list/detail APIs used |
| Calendar health | Aggregate + iCal per listing via calendar APIs | Chip ERROR/ACTIVE |

### Navigation

- Edit / fix → `/{locale}/host/listings/[id]/edit`  
- New → `/{locale}/host/listings/new`  
- Pause/resume remain on dashboard list (current pattern OK)

---

## 12. Reviews

### Supported now

- H3 summary: `reviews.avg_rating`, `reviews.total_reviews`
- List API: `GET /stays/host/reviews` (for a later “View all” panel/page)

### Dashboard placement (P4)

- Compact rating + count.  
- Optional “Latest reviews” **only** when wired to real list API (not fake placeholders).  
- CTA: View reviews (in-page expand or future dedicated view — **no new route required in H5–H6**).

### Explicitly not supported — do not invent

- Unanswered / needs-response queues  
- Host reply composer (unless/until backend supports it)  
- Review moderation beyond existing statuses if already returned by list API

---

## 13. Calendar / availability

### Dashboard role

Surface **health and shortcuts**, not a full ops calendar.

| Element | Behavior |
| ------- | -------- |
| Health chip | `calendar_status.healthy` / `listings_needing_attention` |
| CTA | Fix sync → `#host-calendar-sync` (existing `HostCalendarSyncPanel`) |
| Blocks | Keep date block/unblock as tooling below or nested under Calendar health — not above fold |
| Month grid | **Out of scope** for dashboard body |

Full Host Calendar route remains aspirational (H1); not required to ship H5+.

---

## 14. Charts

### Evaluation

| Chart | Decision | Reason |
| ----- | -------- | ------ |
| Revenue trend (net) | **Defer** | Useful for decisions **when** aggregate series exists; H3 has no series. Do not regenerate a vanity sparkline from `/stats` as the redesign’s Tier 1 once on `/dashboard`. |
| Bookings trend | **Reject for now** | Needs series + doesn’t unlock a same-day action. |
| Occupancy trend | **Reject for now** | Occupancy v1 is already footnoted; trend would over-sell accuracy. |
| Listing performance bar | **Reject for now** | No per-listing analytics API. |

**Locked:** No chart is Tier 1. When a backend series is added to the aggregate path (later phase), add **one** net-revenue trend (7D/30D) only — not a multi-metric chart wall.

---

## 15. Responsive / mobile information hierarchy

Mobile bottom tabs (keep hashes into one page for now):

| Tab | Target |
| --- | ------ |
| Dashboard | Top / Today |
| Bookings | `#host-bookings` |
| Listings | `#host-listings` |
| Profile | existing profile |

### Mobile above-the-fold order

1. Greeting + primary CTA  
2. Today 2×2: check-in · check-out · staying · payment (payment cell muted/hidden if 0)  
3. Action Center (collapsed count chip if > 3 rows)  
4. This-month net (+ MoM)  
5. Booking Center  
6. Earnings/payouts (collapsed accordion default)  
7. Properties  
8. Calendar health CTA  
9. Reviews  

Omit charts on mobile entirely until a real series ships.

---

## 16. Navigation decision (locked)

**Remain a single dashboard page** with section anchors + mobile hash tabs.

| Dedicated route | Decision |
| --------------- | -------- |
| `/host/bookings` | Deferred |
| `/host/calendar` | Deferred |
| `/host/earnings` | Deferred |
| `/host/reviews` | Deferred |
| `/host/listings` index | Deferred (edit/new routes already exist) |

Rationale: dogfood hosts need faster ops clarity first; splitting routes before the information hierarchy is stable risks shipping empty shells. Promote dedicated routes only after Booking Center + Money UX land and mobile hash UX proves insufficient.

---

## 17. States

| State | Behavior |
| ----- | -------- |
| Zero listings | Header CTA Add listing; Booking/Earnings muted; Properties empty with wizard CTA; Action Center may prompt complete first listing |
| Zero bookings | Today zeros + clear empty Action; Booking empty state; earnings zeros with explainer |
| Zero revenue | Show `0` net honestly; do not hide earnings section |
| No reviews | `avg_rating` null / count 0 → “No reviews yet” |
| No payout method / mock | PayoutMethodDisplay `simulated` + disclaimer; available labeled not enabled |
| Pending host verification | Keep verification card primary; do not pretend full ops dashboard |
| Listing problems | Action Center + Properties highlight missing |
| Calendar disconnected / ERROR | Action Center Critical + calendar CTA |
| API error (`/host/dashboard`) | Page-level error with retry; do not silently fall back to conflicting `/stats` math without labeling “approximate / legacy” |
| Partial data | Show available sections; per-section skeletons/errors; never invent messaging/payout available |

---

## 18. Accessibility

| Area | Requirement |
| ---- | ----------- |
| Status indicators | Text labels + icons; never color-only urgency |
| Charts (future) | Data table alternative / accessible summary |
| Tables / booking rows | Semantic list or table; row focusable; dates as text not only icons |
| Keyboard | Filters and Action Center rows keyboard-activatable; skip link to Booking Center |
| Mobile | Touch targets ≥ 44px; sticky primary CTA must not obscure Action rows |
| Live updates | If polling later, `aria-live` polite for Today counts |
| Money | Currency amounts with clear labels (gross vs net) for screen readers |

---

## 19. Desktop wireframe (text)

```text
+------------------------------------------------------------------+
| Nexa · Host Dashboard                    [View arrivals] [Add +] |
| Good afternoon, Sara · Today · Africa/Casablanca · Updated 17:02 |
+------------------------------------------------------------------+
| TODAY                                                             |
|  Check-in 2   Check-out 1   Staying 3   Awaiting payment 1       |
+------------------------------------------------------------------+
| NEEDS ATTENTION                                                   |
|  ! 2 check-ins today ......................... View arrivals      |
|  ! 1 check-out today ........................ View departures     |
|  ! 1 awaiting guest payment ................. View payments       |
|  i Calendar: 1 listing needs sync .......... Fix calendar         |
+------------------------------------------------------------------+
| THIS MONTH (NET HOST EARNINGS)                                    |
|  12,450 MAD   MoM +12%                                            |
|  Gross 14,200 · Fees 1,750 · Pending payout 3,200                 |
|  Occupancy 41% *                                                  |
|  * booked nights ÷ (days × live listings) — blocks not deducted   |
+------------------------------------------------------------------+
| BOOKINGS                                           [Filters v]    |
|  [All] [Arriving] [In today] [Out today] [Staying] [Pay] ...      |
|  --------------------------------------------------------------------|
|  Amine · Riad Medina · 11→14 Aug · CHECK-IN TODAY · 1,200 MAD  →  |
|  Nora  · Apt Gueliz · 08→11 Aug · CHECK-OUT TODAY · 900 MAD    →  |
|  ...                                                              |
+------------------------------------------------------------------+
| EARNINGS & PAYOUTS                                                |
|  Net this month (primary) · expand: prev month · all-time         |
|  Payouts: Pending | Available (not enabled) | Paid out            |
|  Method: Simulated (mock / dogfood)                               |
|  Disclaimer: Test environment — payouts are simulated...          |
+------------------------------------------------------------------+
| PROPERTIES                                                         |
|  Live 2 · Pending 1 · Health 78% · Missing photos (1 listing)      |
|  [Riad Medina LIVE] [Apt Gueliz LIVE] [Draft ...]                  |
+------------------------------------------------------------------+
| CALENDAR HEALTH                          [Manage sync & blocks]    |
+------------------------------------------------------------------+
| REVIEWS  4.8 · 26 reviews                     [View reviews]       |
+------------------------------------------------------------------+
```

---

## 20. Mobile wireframe (text)

```text
+---------------------------+
| Host · Sara        [Add+] |
| Today · Casablanca        |
+---------------------------+
| In 2 | Out 1 | Stay 3 | $1|
+---------------------------+
| Needs attention (3)    v  |
|  Check-ins today →        |
|  Awaiting payment →       |
+---------------------------+
| Net this month            |
| 12,450 MAD  +12%          |
| Pending payout 3,200      |
+---------------------------+
| Bookings                  |
| [In today] [Out] [Pay]…   |
| (rows)                    |
+---------------------------+
| Money ▸ (collapsed)       |
| Properties ▸              |
| Calendar ▸                |
| Reviews                   |
+---------------------------+
| [Home][Bookings][Listings]|
+---------------------------+
```

---

## 21. Traceability (H3 → UI → decision)

| H3 field | UI section | Host decision / action |
| -------- | ---------- | ---------------------- |
| `as_of`, `timezone`, `currency` | Header meta | Trust freshness / FX context |
| `today.checkins_today` | Today / Action / Booking filter | Prepare arrivals |
| `today.checkouts_today` | Today / Action / Booking filter | Turnover / checkout |
| `today.checkouts_tomorrow` | Action informational / filter | Plan tomorrow |
| `today.currently_staying` | Today strip | Know who is in-house |
| `today.new_bookings_today` | Action informational | Awareness of demand |
| `today.awaiting_guest_payment` | Today / Action / Booking filter | Follow unpaid holds |
| `earnings.this_month.net_host_earnings` | Money hero | Primary business pulse |
| `earnings.this_month.mom_pct` | MoM badge | Trend vs last month |
| `earnings.this_month.gross_revenue` | Earnings expand | Understand guest-paid volume |
| `earnings.this_month.platform_fees` | Earnings expand | Understand fees |
| `earnings.previous_month.*` | Earnings expand | Compare prior month |
| `earnings.*_all_time` | Earnings drill | Lifetime context |
| `earnings.upcoming_revenue_30d` | Tier 2 line | Near-term cash expectation (net) |
| `payouts.pending` | Payouts | What ledger says is unpaid to host |
| `payouts.available` | Payouts | Show wallet-not-enabled (0) |
| `payouts.paid_out` | Payouts | Settled (usually none) |
| `payouts.provider`, `mode`, `disclaimer` | PayoutMethodDisplay | Trust / dogfood honesty |
| `operations.upcoming_checkins` | Ops supporting | Pipeline awareness |
| `operations.next_checkin_date`, `next_guest_name` | Action / preview | Who’s next |
| `inventory.live_listings` etc. | Properties / Tier 2 | Inventory readiness |
| `inventory.occupancy_pct_this_month` + `occupancy_basis` | Tier 2 + footnote | Capacity fill (v1 honesty) |
| `reviews.avg_rating`, `total_reviews` | Reviews | Reputation snapshot |
| `messaging.*` | **Omitted** | No decision until available |
| `calendar_status.*` | Action / Calendar CTA | Fix sync errors |
| `listing_health.*` | Action / Properties | Complete listings |
| `bookings_summary.*` | Booking filter badges | Jump to status cohorts |

Supporting APIs (not H3 aggregate, still allowed):

| API | UI |
| --- | -- |
| `GET /stays/host/bookings` | Booking Center rows |
| `GET /stays/host/listings` | Properties list |
| `GET /stays/host/reviews` | Reviews expand / later list |
| External calendar + blocks endpoints | Calendar tooling |
| `GET /stays/host/verification` | Gate |
| `GET /stays/host/stats` | Legacy only during migration |

---

## 22. Implementation sequence (do not implement here)

> Remapped from H1’s H4–H12 naming. **This document is H4 (UX architecture).** H1’s “booking center” work becomes H6 below.

| Phase | Name | Outcome |
| ----- | ---- | ------- |
| **H4** | UX architecture (this doc) | Locked hierarchy & decisions |
| **H5** | Aggregate wiring + KPI hierarchy | Call `GET /stays/host/dashboard`; rebuild Today + Tier 1–2; demote vanity; stop unlabeled `/stats` dual-truth |
| **H6** | Booking Center UX | Filters, urgency chips, check-in/out salience, Action→filter wiring |
| **H7** | Earnings + payouts panel | Gross/fees/net hierarchy; `PayoutMethodDisplay`; disclaimer always on |
| **H8** | Properties + listing health | Actionable missing items; deep links to edit |
| **H9** | Reviews summary (+ list) | Avg/count; optional latest from real API; no fake reply |
| **H10** | Mobile + states | ATF reorder, empty/error/partial, a11y pass |
| **H11+** | Charts/analytics, occupancy rewrite, CMI method, dedicated routes | Only when backends exist / product promotes shells |

Explicit non-goals until later: React in this phase, `/host/analytics`, payout DB, CMI, messaging badge, breaking `/host/stats`.

---

## 23. Contradictions vs H1–H3 (documented, not rewritten)

| Topic | Conflict | H4 resolution |
| ----- | -------- | ------------- |
| Document named H4 | H1 step H4 = Booking operational center | This file = UX architecture; booking work = **H6** in remapped sequence |
| Messages in H1 TODAY strip | H3 `messaging.status = unavailable` | **Omit** messages until available |
| Occupancy definition | H1 wants available nights incl. blocks; H3 is `BOOKED_OVER_CAPACITY_V1` | Show % with **basis footnote**; do not claim true availability occupancy |
| Occupancy Priority A (H1) | H4 elevates ops + net money | Occupancy is **Tier 2** with honesty label |
| Performance chart (H1) | H3 has no series | **No Tier 1 chart**; defer to H11+ |
| ADR (H1) | No ADR on H3 | **Do not show ADR** |
| Primary data path | Web still on `/host/stats` | Redesign **must** use `/host/dashboard` |
| Payouts placement | H1 IA often lists payouts last; money awareness is P0/P2 | Compact pending + net above fold; full payout panel in Money section |
| New bookings attribution | H3 locks `created_at` | Copy must match (“bookings created today”), not “confirmed today” |

H1/H2/H3 files are **not** edited by this H4 delivery.

---

## 24. Final locked decisions

| Topic | Decision |
| ----- | -------- |
| **Primary money KPI** | This month **net host earnings** (+ MoM) |
| **Primary ops KPIs** | Check-ins today, check-outs today, currently staying; awaiting payment when > 0 |
| **Secondary KPIs** | Pending payout, upcoming revenue 30d, occupancy (+ basis), live listings, next guest |
| **Tier 3** | Reviews, calendar/listing health details, previous/all-time money, summary counts — not vanity cards |
| **Booking hierarchy** | Filters: All / Arriving soon / Check-in today / Check-out today / Staying / Awaiting payment / Completed / Cancelled; dates & urgency dominate rows |
| **Earnings hierarchy** | Net primary → gross & fees secondary → previous & upcoming → all-time |
| **Payout UX** | Pending / Available(not enabled) / Paid out + `PayoutMethodDisplay` + required disclaimer; `canWithdraw: false` |
| **Property hierarchy** | Inventory counts + health + listing list; no fake per-listing revenue |
| **Review placement** | P4 summary; list via existing API later; no unanswered invent |
| **Chart selection** | None as Tier 1; single net trend only after aggregate series exists |
| **Mobile hierarchy** | Today 2×2 → Action → Net month → Bookings → collapsed money/properties |
| **Shell / navigation** | Single page + anchors/hash tabs; dedicated host subroutes deferred |
| **Messages** | Omitted while unavailable |
| **ADR** | Omitted until true field exists |
| **Data path** | `GET /stays/host/dashboard` for redesign |

---

## 25. Recommended next phase

**H5 — Aggregate wiring + KPI hierarchy:** connect the web dashboard to `GET /stays/host/dashboard`, implement Today strip + Action Center priority + this-month net hero, and demote the current vanity KPI/sparkline stack — without yet rebuilding the full Booking Center (H6).
