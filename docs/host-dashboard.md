# Host Dashboard

> **Product contract for the redesign:** see [H1 — Host Dashboard Audit & Specification](./host/H1_HOST_DASHBOARD_SPEC.md).  
> **KPI → data mappings:** see [H2 — Host Dashboard Data Contract](./host/H2_HOST_DASHBOARD_DATA_CONTRACT.md).

Overview of what exists today on the Nexa Stays **host dashboard** in `nexastays_web`.

**Route:** `/{locale}/host/dashboard`  
**Primary file:** `app/[locale]/host/dashboard/page.tsx`

This is a single authenticated page (not separate tab routes). Mobile host nav uses hash anchors into the same page (`#host-bookings`, `#host-listings`, `#host-calendar-sync`).

Full host tooling (KPIs, bookings, calendar, listings) is shown only when host verification status is **`APPROVED`**.

---

## Access & verification gate

On load the page calls `getHostVerification` and branches:

| Status | What the host sees |
|--------|--------------------|
| `NOT_STARTED` | Status card + CTA to apply at `/{locale}/host` |
| `PENDING` | Under-review message + links to browse stays / profile |
| `REJECTED` | Rejection reason + “Apply again” |
| `APPROVED` | Full dashboard sections below |

Unauthenticated users are blocked by the normal protected-route flow.

---

## Page layout (top → bottom)

### 1. Header
- Title + subtitle (manage listings vs application status)
- **Home** link
- **Add listing** (approved hosts only) → `/{locale}/host/listings/new`

### 2. Host status card
- Always visible
- Shows verification state and the relevant CTA

### 3. KPI overview (`HostKpiSection`)
Shown when **approved**.

- Earnings hero (total / this month)
- Occupancy, MoM change
- Upcoming & current guests
- Average nightly earnings (ADR)
- Average rating + review count
- Pending payout (if > 0)
- Upcoming 30-day revenue
- Optional 7d/30d revenue sparkline
- Calendar health + listing health checklist (verified live, calendar synced, photos complete, missing items)

Data: `GET /stays/host/stats` with client fallback via `lib/host-dashboard-stats.ts`.

### 4. Today’s action center (`HostTodayActionCenter`)
Shown when **approved**.

Action items such as:
- Check-ins today
- Checkouts tomorrow
- Awaiting payment
- Calendar issues

Empty “all clear” success state when nothing needs attention.

### 5. Calendar sync (`HostCalendarSyncPanel`)
Shown when **approved**. Anchor: `#host-calendar-sync`

- Connect external iCal feeds (Airbnb / Booking / Vrbo / Other)
- Sync / pause / disconnect connected calendars
- Export Nexa ICS URL (copy + regenerate)
- Empty dashed CTA if the host has no listings yet

### 6. Your bookings (`#host-bookings`)
Shown when **approved**.

- Booking rows: guest, dates, status, total paid
- Click row → `/{locale}/bookings/{id}` (host view via `HostBookingDetailView`)
- CSV export with filters (period, listing, status, custom dates)
- Empty state when there are no bookings

### 7. Calendar blocking
Shown when **approved** and the host has ≥ 1 listing.

- Choose listing
- Block / unblock date ranges for availability

### 8. Your listings (`#host-listings`)
Shown when **approved**.

Per listing card:
- Status + completion %
- Missing required fields (drafts / rejected)
- Actions:
  - Continue draft / fix rejected → wizard (`?draft={id}`)
  - Edit → `/{locale}/host/listings/{id}/edit`
  - View public page (when live/approved)
  - Pause / resume live listings

Empty state + “Add your first property” when none exist.

### 9. Footer
- Back to home

---

## What hosts can do from here

| Capability | Where |
|------------|--------|
| See earnings & ops KPIs | KPI section |
| See today’s operational todos | Today’s action center |
| Connect / sync external calendars | Calendar sync panel |
| Export Nexa calendar URL | Calendar sync panel |
| Review bookings + CSV export | Bookings section |
| Block / unblock dates | Calendar blocking |
| Create listing | Add listing → wizard |
| Edit / pause / resume listings | Listings section |
| Open booking details | Bookings → `/bookings/[id]` |

---

## Linked pages

| From dashboard | Goes to |
|----------------|---------|
| Become host / Apply again | `/{locale}/host` |
| Add listing | `/{locale}/host/listings/new` |
| Continue draft / fix rejected | `/{locale}/host/listings/new?draft={id}` |
| Edit listing | `/{locale}/host/listings/{id}/edit` |
| View public listing | `/{locale}/listings/{id}` |
| Booking detail | `/{locale}/bookings/{id}` |
| Browse stays (pending) | `/{locale}/listings` |
| Profile (pending) | `/{locale}/profile` |
| Home | `/{locale}/` |

Related implementation:
- Listing wizard: `components/host/listing-wizard/*`
- Host booking detail: `components/bookings/HostBookingDetailView.tsx`
- Become-a-host onboarding: `app/[locale]/host/page.tsx`

---

## APIs used

| Helper | Endpoint | Purpose |
|--------|----------|---------|
| `getHostVerification` | `GET /stays/host/verification` | Gate |
| `getHostStats` | `GET /stays/host/stats` | KPIs |
| `getHostBookings` | `GET /stays/host/bookings` | Bookings list |
| `exportHostBookingsCsv` | `GET /stays/host/bookings/export` | CSV |
| `getHostListings` | `GET /stays/host/listings` | Listings |
| `pauseHostListing` / `resumeHostListing` | `POST .../pause` · `.../resume` | Listing state |
| `setHostAvailabilityBlock` | `POST .../availability-blocks` | Blocks |
| External calendars | `.../external-calendars` (+ sync) | iCal import |
| Calendar export | `.../calendar-export` (+ regenerate) | iCal export |

Client sources live mainly in `lib/stays-api.ts` and `lib/host-dashboard-stats.ts`.

---

## Navigation into the dashboard

**Desktop navbar**
- Authenticated host: “Host dashboard” → `/host/dashboard`
- Also reachable from profile menu

**Mobile bottom nav** (when on `/host/dashboard` or `/host/listings`)
- Dashboard
- Bookings → `#host-bookings`
- Listings → `#host-listings`
- Profile

---

## Empty / soft states

- Loading spinner while verification/stats load
- Error alert if verification fetch fails
- KPI “Loading KPIs…” while stats load
- Today’s “all clear” banner
- No listings → dashed CTAs for calendar sync + listings
- No calendars connected yet
- No bookings yet
- Sparkline hidden when revenue series is empty
- Pending payout tile only when amount > 0

There are **no** “coming soon” placeholders on the host dashboard itself.

---

## Key source files

| File | Role |
|------|------|
| `app/[locale]/host/dashboard/page.tsx` | Main dashboard page |
| `components/host/HostKpiSection.tsx` | KPIs / earnings |
| `components/host/HostTodayActionCenter.tsx` | Today’s actions |
| `components/host/HostCalendarSyncPanel.tsx` | iCal sync |
| `lib/host-dashboard-stats.ts` | Stats fallback computation |
| `lib/stays-api.ts` | Host API client |

---

## Not on this dashboard (current gaps)

These are common host expectations that are **not** separate sections/routes on the dashboard today:

- Full calendar grid UI (only block form + iCal)
- Dedicated earnings page
- Host inbox / messaging hub on the dashboard
- Dedicated reviews management page
- Standalone listings index route (listings are an anchored section; wizard/edit are separate pages)
