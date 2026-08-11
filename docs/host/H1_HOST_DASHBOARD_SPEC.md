# H1 — Nexa Stays Host Dashboard Audit & Specification

**Status:** AUDIT COMPLETE / IMPLEMENTATION NOT STARTED  
**Scope:** `nexastays_web` + Stays backend host APIs  
**Primary goal:** Define what the host dashboard must do before implementation begins.

> This document is a **product + engineering contract**.  
> It does **not** authorize UI redesign, API changes, migrations, or payout implementation.

---

## Related docs

- [Current host dashboard inventory](../host-dashboard.md) — what exists today in the web app
- [Host account architecture (Stays)](../../../backend/stays/docs/host-account-architecture.md)
- [H2 — Host dashboard data contract](./H2_HOST_DASHBOARD_DATA_CONTRACT.md) — authoritative KPI → field mappings (follow-on)

---

## 1. Executive verdict

The current dashboard is **functional but not yet a strong host operating dashboard**.

Existing foundations:

- Host verification gating
- Host statistics
- Bookings
- Listings
- Calendar blocking
- iCal synchronization
- Listing health
- Today action center
- Earnings
- Ratings
- CSV booking export

The current model is too heavily centered around **sections of functionality** rather than the host’s actual workflow.

The redesigned dashboard should answer, immediately:

1. What is happening today?
2. How is my business performing?
3. What money have I earned?
4. What bookings require attention?
5. Which properties are performing well or poorly?
6. What do I need to do next?

### H1 recommendation

Do **not** simply redesign `HostKpiSection`.

Reorganize around five host jobs:

```text
1. OPERATE
   Check-ins / check-outs / guests / actions

2. MANAGE BOOKINGS
   Upcoming / staying / completed / cancelled

3. UNDERSTAND BUSINESS
   Revenue / occupancy / ADR / bookings / rating

4. MANAGE PROPERTIES
   Listing health / occupancy / revenue / performance

5. MANAGE MONEY
   Earnings / pending payout / payout history / payout method
```

---

## 2. Current architecture audit

### Existing page

```text
/{locale}/host/dashboard
```

Primary file:

```text
app/[locale]/host/dashboard/page.tsx
```

Existing components:

```text
components/host/HostKpiSection.tsx
components/host/HostTodayActionCenter.tsx
components/host/HostCalendarSyncPanel.tsx
components/bookings/HostBookingDetailView.tsx
```

Existing helpers:

```text
lib/host-dashboard-stats.ts
lib/stays-api.ts
```

Current backend capabilities include:

```text
GET  /stays/host/verification
GET  /stays/host/stats
GET  /stays/host/bookings
GET  /stays/host/bookings/export
GET  /stays/host/listings
GET  /stays/host/reviews

POST /stays/host/listings/:id/pause
POST /stays/host/listings/:id/resume

POST /stays/host/availability-blocks

GET/POST/... external-calendars
GET/... calendar-export
```

### Architectural assessment

**Good foundation.** The backend already exposes enough host-specific concepts to build a substantially better dashboard.

The major problem is **aggregation and product semantics**, not simply missing UI.

---

## 3. Host dashboard information architecture

```text
HOST DASHBOARD

┌───────────────────────────────────────────────┐
│ Header                                        │
│ Good morning, {name}                          │
│ All properties ▼                 + Add listing│
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ TODAY                                         │
│ Check-ins  Check-outs  Staying  Messages      │
│ Actions requiring attention                   │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ BUSINESS OVERVIEW                             │
│ Revenue | Occupancy | Bookings | ADR | Rating │
│ Net     | Pending payout                      │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ PERFORMANCE                                   │
│ Revenue / Bookings / Occupancy                │
│ 7D     30D     3M     12M                     │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ BOOKINGS                                      │
│ Upcoming | Check-in | Staying | Completed     │
│ booking rows                                  │
└───────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────┐
│ PROPERTY PERFORMANCE │ │ REVIEWS              │
└──────────────────────┘ └──────────────────────┘

┌───────────────────────────────────────────────┐
│ PAYOUTS                                       │
│ Available | Pending | Paid | Payout method    │
└───────────────────────────────────────────────┘
```

---

## 4. KPI specification

Every number must have an authoritative meaning **before** implementation.

### 4.1 Today KPIs

#### Check-ins today

> Number of confirmed/active bookings whose **check-in date is today**.

Exclude cancelled, rejected, unpaid/pending bookings.

#### Check-outs today

> Number of confirmed/active bookings whose **check-out date is today**.

#### Currently staying

> Guests on active bookings where `check_in <= now < check_out`, confirmed/paid only.

#### New bookings

> Confirmed bookings created (or confirmed) during the current day — exact event must be locked in H2.

#### Messages

> Unread host messages requiring attention.

If messaging cannot supply this metric, return `unavailable` or omit the KPI — **do not fake it**.

---

## 5. Financial KPI specification

### Gross booking revenue

Total booking amount before Nexa deductions (`gross_revenue`).  
Only eligible financial booking states.

### Nexa fees / platform fees

Platform fees deducted (`platform_fees`).

### Net host earnings

```text
gross_revenue - platform_fees - applicable adjustments
```

Do **not** label gross revenue as “earnings.”

### Pending payout

Money owed to the host but not yet paid (`pending_payout`).

### Paid out

Historical amount successfully paid to the host (`paid_out`).

### Available payout

Money eligible for payout but not yet transferred — must respect settlement lifecycle.

For dogfood / mock: mark clearly as simulated (e.g. `mode: "dogfood"`), never pretend it is real bank settlement.

---

## 6. Dogfood payout model

CMI is not live. Design the dashboard around a provider abstraction:

```text
PayoutProvider
├── MockPayoutProvider
└── Future CMI / Nexa Pay provider
```

The UI must not scatter `if (mock)` logic. The API should expose a consistent financial model, for example:

```json
{
  "provider": "mock",
  "mode": "dogfood",
  "available": 12450,
  "pending": 4800,
  "paidOut": 48200,
  "nextPayout": null
}
```

UI must explicitly display:

> **Test environment — payouts are simulated. No real money is transferred.**

---

## 7. Performance KPIs

### Occupancy

```text
occupied nights / available nights
```

Not booking count. Host blocks follow the final business rule. Definition must be **backend-centralized**.

### ADR

```text
eligible accommodation revenue / sold nights
```

Not `revenue / bookings`.

### Booking count

Eligible bookings in the selected period.

### Average rating / review count

Published guest reviews only.

---

## 8. Performance chart

One chart, three metrics: Revenue | Bookings | Occupancy  
Periods: 7D | 30D | 3M | 12M

Do not exclusively download all bookings and compute charts in React at scale.

Conceptual API:

```text
GET /stays/host/analytics?metric=revenue&period=30d
```

Contract details are defined in H2.

---

## 9. Booking center

Filters: All | Upcoming | Check-in | Staying | Completed | Cancelled  
(Later: property, date, guest, status)

Each row should expose guest, property, check-in/out, guests, nights, booking status, payment status, gross amount, host earnings.

Actions: View booking | Message guest — only when backend authz supports them.

---

## 10. Booking lifecycle (host-facing conceptual)

```text
PENDING PAYMENT → CONFIRMED → CHECK-IN → STAYING → CHECK-OUT → COMPLETED
```

Terminal alternatives: CANCELLED | REFUNDED | PAYMENT_FAILED (only if backend supports).

UI must not invent statuses. **H2 audits the authoritative enum.**

---

## 11. Check-in / check-out center

Prominent “Today” lists for check-ins and check-outs with time, guest, property, guests, and View booking (later: message / instructions).

---

## 12. Property performance

Per property: occupancy, revenue, ADR, bookings, rating, listing health.  
Support “All properties” and eventually a property selector.

---

## 13. Reviews

Overview rating + count, latest 3–5 reviews, “needs response” count only if backend supports responses.

---

## 14. Calendar

Keep iCal sync, but do not treat it as the full calendar experience.

- Operational calendar → Host → Calendar (future)
- Integrations → Settings → Calendar integrations (future)

H1 does **not** require new calendar routes.

---

## 15. Listings

Dashboard shows a **summary** only (live status, health %, occupancy, revenue).  
“View all properties” leads to full management. Editor remains separate.

---

## 16. Listing health

Keep the concept; make checks actionable (photos, description, location, pricing, availability, cancellation policy) with Fix issue → links. Never show a bare “92%” without why.

---

## 17. Payout settings

Destination: Payouts → Balance | History | Method  
Dogfood: mock bank + TEST MODE label. Later: bank / CMI / Nexa Pay.

---

## 18. Action center

Evolve `HostTodayActionCenter` into prioritized Critical / Important / Informational actions so hosts do not hunt across five sections.

---

## 19. Dashboard priority

### Priority A — above the fold

Today, Actions, Check-ins, Check-outs, Revenue, Occupancy, Bookings

### Priority B

Performance, Upcoming bookings, Property performance, Reviews

### Priority C

Payout summary, Calendar sync, Listing health

### Priority D

Detailed analytics, advanced financial reporting, advanced calendar

---

## 20. Proposed navigation (future)

```text
HOST
Dashboard | Calendar | Bookings | Listings | Reviews | Earnings | Messages | Settings
```

Settings: Profile | Payouts | Calendar integrations | Notifications | Account

**H1 does not require creating these routes yet.**

---

## 21. Backend API contract (conceptual)

Prefer an aggregation layer:

```text
GET /stays/host/dashboard
```

Specialized APIs remain underneath (bookings, listings, calendar, analytics, payouts, reviews).

Avoid 10–15 independent browser requests on every load once hosts have large history.

---

## 22. Critical backend audit items (H2)

Before UI/API implementation:

- A. Booking status enum  
- B. Payment statuses  
- C. Revenue source of truth  
- D. Platform fee calculation  
- E. Host earnings calculation  
- F. Occupancy / blocking semantics  
- G. Check-in/out timezone (Morocco / Africa/Casablanca)  
- H. Reviews model / published / response support  
- I. Payout / ledger model existence  
- J. Host authZ (JWT identity, ownership — never trust client `hostId`)

---

## 23. Security requirements

Every host resource:

```text
request.user → host ownership → resource ownership → data
```

Never trust client-provided `hostId`.

---

## 24. Performance requirements

Initial dashboard API: &lt; 500 ms ideal, &lt; 1 s acceptable.  
Use server-side aggregation and indexed queries — not “load everything in the browser.”

---

## 25. Empty states

Every major section needs a useful empty state (no bookings, no listings, no reviews, no payout method, no calendar). Dogfood: “Payouts are currently simulated.”

---

## 26. Mobile requirements

Not a squeezed desktop page. Temporary hash-anchor nav is acceptable; eventual tabs: Dashboard | Bookings | Calendar | Messages | More.

---

## 27. Final MVP section matrix

| Section | Priority | MVP |
| -------- | -------: | --: |
| Today | P0 | Yes |
| Action center | P0 | Yes |
| Check-ins | P0 | Yes |
| Check-outs | P0 | Yes |
| Business KPIs | P0 | Yes |
| Revenue chart | P1 | Yes |
| Booking center | P0 | Yes |
| Property performance | P1 | Yes |
| Reviews | P1 | Yes |
| Listing health | P1 | Yes |
| Payout summary | P1 | Yes |
| Payout method | P1 | Mock |
| Calendar (ops) | P1 | Separate evolution |
| iCal integrations | P2 | Existing |
| Advanced analytics | P2 | Later |
| Messaging hub | P2 | Later |
| Full earnings page | P2 | Later |

---

## 28. H1 implementation boundary

**Do NOT implement yet:**

- No new React components for the redesign
- No API changes
- No DB migrations
- No payout database
- No KPI calculation changes in product code
- No booking-status changes
- No visual redesign
- No mock financial transactions that pretend to be real settlement

H1 is only the **contract/specification**.

---

## 29. Recommended implementation order (post-H1)

| Step | Name |
| ---- | ---- |
| H2 | Backend audit + data contract (this repo: see H2 doc) |
| H3 | Host dashboard aggregated API |
| H4 | Booking operational center |
| H5 | Financial KPIs |
| H6 | Performance analytics |
| H7 | Property performance + listing health |
| H8 | Reviews |
| H9 | Mock payout method + payout UI |
| H10 | Dashboard UX/UI implementation |
| H11 | Mobile host experience |
| H12 | Security + performance + regression audit |

---

## H1 verdict

| Area | Rating | Note |
| ---- | ------ | ---- |
| Current host dashboard | Functional but insufficient | Stronger as ops dashboard needed |
| Existing backend foundation | Good enough to extend | Audit before UI |
| Main gap | KPI/business semantics + aggregation | Authoritative definitions first |
| Payout capability | Not sufficiently defined | Design mock without fake real money |

**Next action:** H2 — audit Stays models/services and publish the authoritative data/API contract for every dashboard KPI.
