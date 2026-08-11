# H12 — Host Operations & Action Integrity Audit

## Status

**AUDIT COMPLETE · API DECISION LOCKED**  
**H12 API: MIXED — EXISTING + ENHANCEMENTS**

**Scope:** Read-only architecture / contract audit after H3–H11  
**Authorized file change:** this document only  
**Does not authorize:** implementation, API/UI changes, schema work, fake operational state  

**Upstream (must remain unchanged):** H1–H11, especially H3 dashboard, H4 Action Center IA, H6 Booking Center, H7–H11 analytics/reviews.

---

## 1. Executive Verdict

The host product **already has enough authoritative APIs** for the next honest operations phase **without inventing a mega Action Center API**.

| Area | Verdict |
| ---- | ------- |
| Dashboard Action Center | **Informational + navigation** (filter/scroll). Not an executable action queue. |
| Check-in / check-out “actions” | **Date-based urgency only.** No host mark-check-in/out API. |
| Calendar readiness | **Authoritative** via external calendars + H3 `calendar_status` + calendar sync APIs. |
| Listing readiness | **Authoritative** via shared `listing-completion.ts` percentages/flags. |
| Payouts | **Ledger PENDING + mock honesty.** `available = 0`. No wallet/withdraw. `paid_out` usually 0. |
| Messaging on dashboard | **Unavailable** by contract (`unread_count: null`). |
| Review ops | Reading exists (H9). Replies/unread still forbidden. |
| Primary risk | UX language (**“Check-in today”**, payout timing copy) can be mistaken for executable/financial truth. |
| AuthZ | JWT `userId` host scoping is strong; **P1 drift** between `HostsService.canList` and `HostOnboardingService.canList`. |

**Overall decision:**  
**H12 API: MIXED — EXISTING + ENHANCEMENTS**

Prefer wiring/documentation/honesty enhancements to existing surfaces. Do **not** create a new Action Center aggregate endpoint unless a future product phase introduces executable host actions that do not exist today.

---

## 2. Scope

### In scope

1. Calendar / availability readiness  
2. Listing health / readiness  
3. Check-in / check-out operational semantics  
4. Booking action integrity  
5. Calendar sync / external calendar state  
6. Payout operational state  
7. Verification / host readiness gates  
8. Dashboard Action Center truthfulness  
9. Navigation from alerts → authoritative detail  
10. Remaining host operational gaps after H3–H11  

### Out of scope (explicit)

- Implementing any recommendation  
- Changing backend/web/database  
- Review replies, messaging unread invention  
- Wallet / CMI enablement  
- Occupancy rewrite including blocks  
- H13+ implementation  

---

## 3. Source-of-Truth Map

| Concern | Authoritative source | Evidence |
| ------- | -------------------- | -------- |
| Host identity | JWT `user.userId` / Identity `sub` | `stays.controller.ts` host GETs; H3/H4 lock |
| Listing ownership | `stays_listings.host_user_id` | `HostListingsService.requireOwnedListing`, calendar assert owner |
| Dashboard snapshot | `GET /stays/host/dashboard` | `HostDashboardService.getHostDashboard` |
| Legacy flat stats | `GET /stays/host/stats` | Process-local day math (compat) |
| Booking list/detail | `GET /stays/host/bookings`, `GET /stays/bookings/:id` | Host join via listing ownership |
| Booking lifecycle presentation | `BookingLifecycleService.computeLifecycle` | Status + dates |
| Reviews reading | `GET /stays/host/reviews` | H8/H9 |
| Property analytics | `GET /stays/host/analytics` | H10/H11; includes `health.attention` |
| Listing completion | `listing-completion.ts` | Flags + weighted `%` |
| External calendars | `stays_external_calendars` + CalendarSyncService | ACTIVE/SYNCING/ERROR/PAUSED |
| Availability blocks | `stays_availability_blocks` | HOST/ADMIN/BOOKING/ICAL precedence in sync |
| Guest searchable availability | `StaysAvailabilityService` | Blocks + booked nights |
| Host occupancy KPI | H3 `BOOKED_OVER_CAPACITY_V1` / H10 `BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1` | **Ignores blocks** |
| Payout ledger | `stays_ledger_entries` type `HOST_PAYOUT` | PENDING / SETTLED / FAILED |
| Wallet available | Hardcoded `0` in H3 | `host-dashboard.service.ts` |
| Messaging unread (dashboard) | Explicitly unavailable | H3 `messaging.status = unavailable` |
| Host application gate (web) | `GET /stays/host/verification` → APPROVED | dashboard/reviews/analytics pages |
| Host list capability (API) | `HostsService.canList` → `isApprovedHost` | See §8 drift |

---

## 4. Action Center Audit

### What exists today

H4 defined an Action Center. H5 implemented **`HostTodaySection`** (`components/host/HostTodaySection.tsx`) as the live attention surface.

**Dead code (not wired):** `HostTodayActionCenter.tsx`, `HostKpiSection.tsx`.

### Actions / alerts currently shown

| Label (concept) | Source | Endpoint | Authoritative fields | Derivation | Executable action? | Destination |
| ----------------- | ------ | -------- | -------------------- | ---------- | ------------------ | ----------- |
| Check-ins today | H3 `today.checkins_today` | `/stays/host/dashboard` | booking status + checkin date vs Casablanca today | Date+status | **No** | Filter Booking Center `checkin_today` |
| Check-outs today | H3 `today.checkouts_today` | same | status + checkout date | Date+status | **No** | Filter `checkout_today` |
| Awaiting payment | H3 `today.awaiting_guest_payment` | same | lifecycle `PENDING_PAYMENT` | Lifecycle | **No** (no chase-payment API) | Filter `payment_pending` |
| Calendar issues | H3 `calendar_status` | same + calendars API | external calendar `ERROR` | Unique listing count with ERROR | **Navigate only** | Scroll `#host-calendar-sync` (real sync UI exists there) |
| Listing health missing | H3 `listing_health.missing` | same + listings completion | completion flags | Aggregated missing | **Navigate only** | Scroll `#host-listings` |
| Check-outs tomorrow / new bookings | H3 today fields | same | dates / created_at Casablanca | Date | Informational scroll | `#host-bookings` without filter |

### Integrity findings

| Risk | Class |
| ---- | ----- |
| Host may infer “Check-in today” means they must/can confirm check-in | **P1 UX trust** — date urgency ≠ action-available |
| Empty Action Center “caught up” does not mean no payout/ledger issues | P2 |
| Dead `HostTodayActionCenter` still on disk could confuse future editors | P3 cleanup |
| Inventory doc `docs/host-dashboard.md` still describes old ActionCenter/KPI UI | P3 docs drift (not rewriting here) |

**H4 compliance:** Interaction model (filter/scroll, no fake Confirm check-in) is largely honored by `HostTodaySection`.

---

## 5. Check-in / Check-out Audit

### Authoritative dates

| Field | Source |
| ----- | ------ |
| Check-in date | `stays_bookings.checkin_date` (date-only) |
| Checkout date | `stays_bookings.checkout_date` (date-only) |
| “Today” for H3/H6 | `Africa/Casablanca` via `host-dashboard-timezone.ts` / web Casablanca helpers |

### Lifecycle statuses

Booking enum includes `CHECKED_IN`. Lifecycle presentation (`BookingLifecycleService`) maps dates + status → `UPCOMING | ACTIVE | COMPLETED | PENDING_PAYMENT | CANCELLED | EXPIRED`.

**Important:** Active stay can be derived from `CONFIRMED` + date overlap; hosts do **not** need to write `CHECKED_IN` for H3 “currently staying.”

### Executable host actions

| Action | Backend? | Web? |
| ------ | -------- | ---- |
| Mark check-in | **No host endpoint found** (only seeds set `CHECKED_IN`) | No |
| Mark check-out | **No** — scheduler auto-completes (`BookingLifecycleSchedulerService`) | No |
| Cancel booking | **Yes** `POST /stays/bookings/:id/cancel` | Yes (`HostBookingDetailView`) |
| Message guest | **Yes** messaging module | Yes |
| View booking | **Yes** | Yes |

### DATE-BASED URGENCY vs ACTION-AVAILABLE STATE

| Concept | Exists? | Notes |
| ------- | ------- | ----- |
| Date-based urgency | **Yes** | H3 counts + H6 `classifyHostBookingUrgency` |
| Action-available check-in | **No** | Must not be implied |
| Badge `CHECKED_IN` | Status label | Not an action button |

**H6 integrity:** Urgency badges are consistent with Casablanca date rules and booking statuses, but they are **operational awareness**, not executable workflow state. Do not modify H6 in H12.

---

## 6. Calendar & Availability Audit

### Authoritative pieces

| Piece | Role |
| ------ | ---- |
| `stays_external_calendars` | Import feed config + `ACTIVE\|SYNCING\|ERROR\|PAUSED` |
| Sync logs | SUCCESS / NOT_MODIFIED / TIMEOUT / ERROR |
| `stays_availability_blocks` | Night holds; sync writes ICAL without overwriting HOST/ADMIN |
| `GET/POST/PATCH/DELETE .../external-calendars` + `.../sync` | Host management |
| ICS export | `calendar-export` + public `calendar/:token` |
| Guest availability | `StaysAvailabilityService` uses blocks + bookings |

### Dashboard calendar_status

Built in `HostDashboardService.getHostDashboard`:

- `healthy`: no calendars with `ERROR`
- `listings_needing_attention`: count of distinct listings with ERROR

**Actionable enough?** As a **pointer** to Calendar Sync Panel — yes. As a full calendar health product — partial (no last_sync age, no stale-without-ERROR signal on dashboard).

### Occupancy vs availability (trust)

| Metric | Denominator includes blocks/ICAL? |
| ------ | --------------------------------- |
| H3 host occupancy | **No** (`BOOKED_OVER_CAPACITY_V1`) |
| H10 property occupancy | **No** (`BOOKED_NIGHTS_OVER_PERIOD_DAYS_V1`) |
| Guest bookability | **Yes** (availability service) |

UI already footnotes this in places (H5 snapshot, H11 occupancy footnote). Keep honesty.

### API decision for calendar

**Existing APIs sufficient** for calendar management UI. Dashboard needs **web wiring only** (already largely present via `HostCalendarSyncPanel`). Optional later enhancement: expose last_sync/error detail on H3 `calendar_status` — not required to invent a new API now.

---

## 7. Listing Health / Readiness Audit

### Shared completion model

`backend/stays/src/modules/stays/listing-completion.ts`:

- Flags: location, about, pricing, photos (≥5), photo quality (≥12), rooms, walkthrough, amenities, house rules  
- Weighted percentage (deterministic, shared)  
- Submit gate = required subset via `assertCanSubmit`

Exposed on host listings summaries and rolled into H3 `listing_health` (`buildListingHealth`) and H10 `properties[].health`.

### Host can determine

| Signal | Authoritative? |
| ------ | -------------- |
| Listing status DRAFT/SUBMITTED/APPROVED/LIVE/PAUSED/REJECTED | Yes |
| Completion % / missing | Yes (shared function) |
| Photos complete flag | Yes |
| Calendar ERROR / ACTIVE | Yes (external calendars) |
| Composite “best listing score” | **No — must not invent** |
| “Bookable because LIVE” | Incomplete — LIVE ≠ blocks-free or payment-ready |

### Safety to aggregate

Host-level `avg_completion_pct` and `missing` rollup are **safe informational** aggregates of real per-listing completion — not invented marketing scores.

---

## 8. Verification / Host Readiness Audit

### States

| State | Owner | Role |
| ----- | ----- | ---- |
| `application_status` | `stays_host_profiles` / onboarding | Approves host to use dashboard gate |
| `host_verification_status` | same | Intended KYC/verification companion |
| `listing_frozen` | same | Blocks listing ops when set |
| Listing status | listings | Publish path DRAFT → SUBMITTED → admin APPROVED → LIVE |

### Web gate

`ProtectedRoute` = authenticated only.  
Dashboard / reviews / analytics = additional `getHostVerification` → `APPROVED` UI gate.

### Divergence (P1)

| Method | Behavior |
| ------ | -------- |
| `HostOnboardingService.isApprovedHost` | `application_status === 'APPROVED'` |
| `HostOnboardingService.canList` | application APPROVED **and** `host_verification_status === 'APPROVED'` **and** `!listing_frozen` |
| `HostsService.canList` | Delegates to **`isApprovedHost` only** |

Listing create/submit paths use `HostsService.canList` (stricter onboarding `canList` not applied). Approve flow currently sets both statuses together, so dogfood may hide drift — still a **correctness / hardening** gap.

**Do not redesign Identity/KYC in H12.** Record for future hardening.

---

## 9. Payment / Payout Audit

### What is real

| Item | Reality |
| ---- | ------- |
| `guest_fee` / `host_fee` / `total_paid` / `payout_amount` on bookings | Real booking money fields |
| Ledger `HOST_PAYOUT` on confirm | Created **PENDING** |
| Guest payment / platform fee rows | Often **SETTLED** at confirm |
| H3 `payouts.pending` | Σ PENDING HOST_PAYOUT for host |
| H3 `payouts.available` | **Always 0** (no wallet) |
| H3 `payouts.paid_out` | Σ SETTLED HOST_PAYOUT (typically 0 — **no settlement flip found**) |
| CMI | Provider/webhooks present; config marks real settlement **future** |
| Mock/dogfood | Disclaimer strings required and shown |

### UI integrity

| Surface | Findings |
| ------- | -------- |
| `HostPayoutStatus` | Shows pending + method + disclaimer; **does not show Available/Paid out** (H4 wanted all three) |
| Booking detail | “Total Payout” + release-after-check-in hint — **timing promise risk** |
| Analytics properties | Shows pending/paid_out per property |

### Locked rule (preserve)

`available = 0` while no real wallet exists. No Withdraw CTA.

**Classification:** mock/dogfood financial presentation is **intentional**. Future wallet = product + backend domain change, not H12.

---

## 10. Booking Action Integrity

| Action | Backend | AuthZ | Web exposed | Executable? | Integrity note |
| ------ | ------- | ----- | ----------- | ------------ | -------------- |
| View booking | GET booking | Host via listing ownership | Yes | Navigate | OK |
| Message guest | Messaging APIs | Conversation membership | Yes | Yes | Outside H3 |
| Cancel | POST cancel | Guest or listing host | Yes when lifecycle allows | Yes | OK |
| Call guest | n/a | Client tel: | If phone present | Soft | Privacy depends on booking payload |
| Confirm check-in | **Missing** | — | **No button** | No | Good (H4); urgency label still noisy |
| Confirm checkout | **Missing** | — | No | No | Scheduler completes |
| Sync calendar | Calendar sync APIs | Owned listing | Calendar panel | Yes | OK |
| Pause/resume listing | Host listing APIs | Owned | Dashboard listings | Yes | OK |
| Export CSV | Export endpoint | JWT host | Booking Center | Yes | OK |
| Chase payment | **No dedicated API** | — | Filter only | No | Do not imply collection tool |
| Respond to review | **Missing** (H8) | — | No | No | Preserve H8/H9 lock |
| Withdraw payout | **Missing** | — | No CTA | No | Preserve H3/H4 |

---

## 11. H3 Dashboard Contract Audit

| Field group | Classification | Notes |
| ----------- | -------------- | ----- |
| `today.checkins_today` / checkouts / staying / new | **C derived safe** (date) | Informational urgency; not action-available |
| `today.awaiting_guest_payment` | **C** | Lifecycle; no chase action |
| `earnings.*` | **A/B** | H3 money formulas authoritative |
| `payouts.pending` | **A** ledger | Real PENDING sum |
| `payouts.available` | **F mock/unavailable** | Always 0 by design |
| `payouts.paid_out` | **B** | Authoritative sum; usually 0 |
| `payouts.disclaimer` | **A** required honesty | Keep visible |
| `operations.*` | **C** | Next check-in informational |
| `inventory.occupancy_*` | **D potentially misleading** if misread as true availability | Footnote required |
| `reviews.*` | **B** | Host summary; reading on H9 |
| `messaging.*` | **E unavailable** | Must stay omitted/null |
| `calendar_status` | **B actionable pointer** | ERROR count; detail on calendar APIs |
| `listing_health` | **B/C** | Rollup of shared completion |
| `bookings_summary` | **C** | Status class counts |

Do **not** alter H3 in H12.

---

## 12. API Gap Analysis

| Gap | Classification | Evidence |
| --- | -------------- | -------- |
| Executable check-in/out | **Backend domain change required** + product decision | No write endpoint |
| Action Center “needs attention” unread invent | **Intentionally unavailable** | Same discipline as messaging/reviews |
| Calendar ERROR attention | **Existing API sufficient** | H3 + calendar panel |
| Listing completion CTA | **Existing API sufficient** | Host listings + scroll |
| Payout Available/Paid out UI parity | **UI only** (fields already on H3) | `HostPayoutStatus` omission |
| Booking deep-link from Today chip | **UI only** | Today sets filter, not `/bookings/:id` |
| `HostsService.canList` vs onboarding `canList` | **Compatible enhancement / hardening** | Method drift |
| getHostStats process-local TZ | **Existing API keep legacy**; do not dual-truth H3 | Documented |
| listHostReviews N+1 | **Enhancement** (perf) | Service loop findOne |
| Review replies | **Product decision** / future domain | H8 lock |
| Wallet withdraw | **Product + domain** | Forbidden now |
| Blocks-aware occupancy | **Intentionally unavailable** for KPI basis | H3/H7/H10 locks |
| Unified Action Center API | **Not required yet** | No new executable states to aggregate |

---

## 13. Responsibility Boundaries

| Surface | Owns |
| ------- | ---- |
| **Dashboard** (`/host/dashboard`) | Operational snapshot, Today attention, honest money, pointers |
| **Booking Center** | Urgency, filters, CSV, navigate to booking detail |
| **Booking detail** | Cancel, message, call — real actions |
| **Calendar Sync Panel** | External calendars, sync, export ICS, blocks UI entry |
| **Listings** | Edit, pause/resume, completion remediation |
| **Analytics** (`/host/analytics`) | Period performance + per-property health attention flags |
| **Reviews** (`/host/reviews`) | Published review reading |
| **Verification / host apply** | Eligibility gate |
| **Payments/Payouts** | Ledger truth + mock honesty until wallet exists |

Do not collapse these into one new endpoint.

---

## 14. Security / Authorization

| Check | Finding | Severity |
| ----- | ------- | -------- |
| JWT-only host scope on dashboard/analytics/reviews/bookings | Confirmed; no client `hostId` | — |
| Listing ownership on calendar/blocks/edit | `requireOwnedListing` / assert owner | — |
| Cross-host isolation tests | Present on H3/H10 specs | — |
| `HostsService.canList` weaker than `HostOnboardingService.canList` | Potential list create before verification status aligned | **P1** |
| Booking cancel host check | listing host_user_id | OK |
| IDOR on host routes | No hostId trust found in host GET analytics/dashboard | — |

**H12 does not patch.** Remediation recommendation: make `HostsService.canList` delegate to `HostOnboardingService.canList` (future phase).

---

## 15. Timezone Consistency

| Surface | Zone | Notes |
| ------- | ---- | ----- |
| H3 dashboard | `Africa/Casablanca` | Locked |
| H6 booking urgency (web) | Casablanca via `casablancaYmd` | Aligned with H3 intent |
| H10/H11 analytics periods | Casablanca | Locked |
| `GET /stays/host/stats` | **Process-local** | Legacy dual-truth if still consumed |
| Calendar sync scheduler | Server clock + stored next_sync | Not presented as Casablanca “today” KPI |

**Flag:** Any UI still reading `/host/stats` for “today” could disagree with dashboard Casablanca day — prefer H3 only (H4 lock).

---

## 16. Performance Findings

| Issue | Severity |
| ----- | -------- |
| H3/H10 in-memory aggregation over all host bookings | P2 (accepted for dogfood) |
| `listHostReviews` per-listing `findOne` loop for summary | P2 |
| ICAL sync per-night lookups | P2–P3 at sync time |
| Dashboard loads listings + bookings + ledger + calendars + reviews summary + completion | P2 acceptable; watch host growth |

No P0 perf defect identified for current portfolio sizes.

---

## 17. UX Trust Findings

| Copy / pattern | Risk | Required truth |
| -------------- | ---- | -------------- |
| “Check-ins today” / urgency “Check-in today” | Sounds executable | Date-based count only; no confirm API |
| “You’re all caught up” | Over-broad | Only relative to Today chip set |
| Payout “wallet is not enabled yet” | Future implication | OK with disclaimer; never Withdraw |
| Booking “payout released 24h after check-in” | Settlement promise | Ledger does not auto-SETTLE HOST_PAYOUT today |
| Occupancy % | True availability illusion | Keep basis footnotes |
| “Identity verified” on booking detail | May overstate | Needs booking/occupant verification evidence check in future |
| Messaging omitted | Correct | Keep omitted while unavailable |
| Review reply / unread | Must not appear | H8/H9 locks hold |

Do **not** rewrite UI in H12.

---

## 18. Priority Matrix

| ID | Finding | Priority |
| -- | ------- | -------- |
| O1 | No host check-in/out write API while urgency language exists | P1 (UX trust / future product) |
| O2 | `HostsService.canList` vs onboarding `canList` drift | P1 (AuthZ consistency) |
| O3 | H4 payout Available/Paid out not shown on dashboard panel | P2 (UI honesty/parity) |
| O4 | Booking detail payout release copy vs ledger reality | P2 (trust) |
| O5 | listHostReviews N+1 | P2 |
| O6 | Dead ActionCenter/KPI components + stale inventory doc | P3 |
| O7 | `/host/stats` process-local TZ legacy | P3 (avoid dual-truth) |
| O8 | Identity-verified badge overclaim risk | P2–P3 |
| O9 | No wallet/CMI HOST_PAYOUT settlement | Intentionally unavailable (lock) |
| O10 | Messaging unread | Intentionally unavailable (lock) |

---

## 19. Recommended Next Phase

**Recommended ownership after H12:**

1. **H13 (suggested) — Operations honesty / action integrity UI-hardening**  
   - Clarify date urgency vs executable actions (copy/IA only where possible)  
   - Complete H4 payout triad display from existing H3 fields  
   - Soft-deprecate dead host components / update inventory docs  
   - **No** check-in API unless product explicitly opens that domain  

2. **Parallel hardening (backend, not UX):** unify `canList` to onboarding definition; optional reviews N+1 fix  

3. **Defer:** wallet, CMI settlement, review replies, blocks-aware occupancy, Action Center mega-API  

Do **not** start H13 inside this audit delivery.

---

## 20. Required API Decision

### Decision table

| Capability | Existing API | Enhancement | New API | Backend change | UI only | Product decision | Decision |
| ---------- | ------------ | ----------- | ------- | -------------- | ------- | ---------------- | -------- |
| Today attention chips | H3 today + calendar_status + listing_health | — | No | No | Optional copy clarity | Keep navigate/filter model | **Existing** |
| Executable check-in/out | — | — | Would need new | Yes | No | Required before any Confirm CTA | **Product decision / defer** |
| Calendar sync management | External calendar endpoints | Optional last_sync on H3 | No | No | Already mostly wired | — | **Existing** |
| Listing readiness | Host listings + H3 listing_health | — | No | No | Wire/scroll OK | — | **Existing** |
| Payout triad UI | H3 payouts.* | — | No | No | Show available/paid_out | — | **UI only** |
| Message guest | Messaging APIs | — | No | No | Exists on detail | — | **Existing** |
| Cancel booking | Cancel endpoint | — | No | No | Exists | — | **Existing** |
| Review reading | `/host/reviews` | — | No | No | H9 done | — | **Existing** |
| Review replies | — | — | Future | Future | Forbidden now | Yes | **Intentionally unavailable** |
| Wallet withdraw | — | — | Future | Future | Forbidden | Yes | **Intentionally unavailable** |
| canList consistency | Onboarding canList exists | HostsService.canList | No | Small hardening | No | — | **Enhance existing** |
| Unified Action Center API | — | — | Not justified | No | No | Only if new executable states ship | **No new API yet** |

### Exact overall outcome

# H12 API: MIXED — EXISTING + ENHANCEMENTS

**Reasoning**

1. Most operational needs already have authoritative endpoints (H3, bookings, calendars, listings, messaging, reviews, analytics).  
2. Gaps that hurt trust are primarily **UI honesty** and **AuthZ consistency**, not missing aggregate read APIs.  
3. The only “new API” candidates (check-in write, wallet settlement, review reply) are **domain features**, not dashboard aggregates — and they remain product-gated.  
4. Creating `GET /stays/host/actions` now would package date-derived KPIs already on H3 and invite fake “actionable” semantics.

---

## 21. Explicit Non-Goals

- Implementing H12 recommendations  
- New Action Center endpoint  
- Host check-in/out APIs  
- Wallet / withdraw / CMI enablement  
- Inventing unread / needs-response / composite health scores  
- Occupancy rewrite with blocks  
- Changing H1–H11 markdown contracts  
- Modifying application/backend/database code as part of this phase  

---

## 22. Capability Matrix

| Capability | Current state | Authoritative? | Executable? | API needed for next step | Priority |
| ---------- | ------------- | -------------- | ----------- | ------------------------ | -------- |
| See today’s check-ins count | Yes (H3) | Date-derived yes | No | None | — |
| Confirm guest check-in | No | — | No | New domain API if product wants | P1 product |
| See check-outs today | Yes | Yes | No | None | — |
| Mark checkout | No (scheduler) | — | No | Product | P2 |
| Awaiting payment list | Yes (filter) | Lifecycle yes | No chase tool | None / product | P2 |
| Calendar ERROR attention | Yes | Yes | Sync on calendar panel | Existing | — |
| Manage iCal import/export | Yes | Yes | Yes | Existing | — |
| Listing completion % | Yes | Yes | Edit listing | Existing | — |
| Pause/resume listing | Yes | Yes | Yes | Existing | — |
| Pending payout amount | Yes | Ledger yes | No withdraw | Existing | — |
| Available balance | Always 0 | Honesty field | No | Keep | — |
| Paid out | Field exists; UI weak on dashboard | Ledger | No | UI only | P2 |
| Message guest | Yes | Yes | Yes | Existing | — |
| Cancel booking | Yes | Yes | Conditional | Existing | — |
| Host reviews reading | Yes H9 | Yes | Read-only | Existing | — |
| Review reply | No | — | No | Future | P3 |
| Messaging unread on dashboard | Unavailable | Explicit | No | Forbidden invent | — |
| Property analytics attention flags | Yes H10/H11 | Derived from real signals | Navigate | Existing | — |
| True blocks-aware occupancy KPI | No | — | — | Domain rewrite later | P3 |

---

### Implementation confirmation

- **No application code changed**  
- **No backend code changed**  
- **No database/migrations changed**  
- **Only this audit markdown is authorized**

**H12 complete:** AUDIT COMPLETE · API DECISION LOCKED · IMPLEMENTATION NOT STARTED
