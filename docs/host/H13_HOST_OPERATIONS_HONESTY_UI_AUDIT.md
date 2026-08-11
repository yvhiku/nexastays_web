# H13 — Host Operations Honesty & Action Integrity UI Audit

## Status

**AUDIT COMPLETE · API DECISION LOCKED · IMPLEMENTATION NOT STARTED**

**H13 API: EXISTING + UI ENHANCEMENTS**

**Scope:** Read-only UI honesty / action-integrity audit after H3–H12  
**Authorized file change:** this document only  
**Does not authorize:** implementation, API/UI/copy changes, schema work, fake operational state  

**Upstream locked:** H1–H12 (H12 commit `2d0bc0b`, H12 API: MIXED — EXISTING + ENHANCEMENTS). H1–H12 contracts must remain unchanged.

**Evidence date:** re-verified against repository code (web + stays backend) on 2026-08-11. H12 findings were not assumed current without code checks.

---

## 1. Executive Verdict

The host web product **already has authoritative read APIs** for operations surfaces. Trust risk is concentrated in **wording and control semantics**, not in a missing Action Center aggregate.

| Area | Honesty verdict |
| ---- | --------------- |
| Today / Action Center (`HostTodaySection`) | **Informational metrics + FILTER/SCROLL rows** rendered as full-width `<button>` with amber “attention” framing. Right-side CTAs say “View bookings →” / calendar sync / listings — mitigates but does not eliminate action implication. |
| Check-in / check-out | **Date+status urgency only.** No host mark-check-in/out endpoint. Scheduler auto-completes stays after checkout time. |
| Awaiting payment | **Informational filter.** No chase/collect payment host API. |
| Payout dashboard panel | Shows **pending + method + wallet-not-enabled + disclaimer**. Omits H3 triad **available** / **paid_out**. Booking detail `payoutHint` claims release **24h after check-in** — unsupported by ledger settlement. |
| Calendar | ERROR → real external-calendar attention; sync/pause/export invoke real APIs. Occupancy footnotes correctly say blocks are not deducted. |
| Listing health | Completion % / missing fields — **not** quality score / “fully bookable” invention. |
| Reviews / messaging | H9 read-only reviews intact. Dashboard messaging remains **unavailable**. No reply / unread inventing in host ops UI. |
| AuthZ | **Confirmed drift:** `HostsService.canList` → `isApprovedHost` only; `HostOnboardingService.canList` also requires `host_verification_status === 'APPROVED'` and `!listing_frozen`. |
| Empty states | Today “You're all caught up for today.” overclaims relative to full ops surface (narrow: no listed attention chips). |

**Overall:** Prefer **UI honesty enhancements** on existing H3/H6/H9/H11 surfaces. Do **not** create `GET /stays/host/actions` or check-in/out write APIs in the next honesty phase unless product explicitly introduces executable workflows.

---

## 2. Scope

### In scope

1. Today / Action Center truthfulness  
2. Check-in / check-out honesty vs backend  
3. Payout presentation vs ledger  
4. Action vs navigation integrity for host ops CTAs  
5. Booking Center (H6) integrity (read-only audit)  
6. Calendar / availability honesty  
7. Listing health honesty  
8. Verification / readiness / `canList` drift  
9. Reviews / messaging honesty (H8/H9 boundary)  
10. Empty-state overclaims  
11. Navigation / deep-link destinations  
12. Mobile / i18n / RTL honesty (report only)  
13. Source-of-truth matrix + recommendations for a later implementation phase  

### Out of scope (explicit)

- Any application, backend, i18n, test, config, or schema change  
- Fixing findings discovered here  
- Creating new APIs / fake operational state  
- Redesign or copy edits  

---

## 3. H3–H12 Contract Verification

| Contract | Still accurate vs code? | Discrepancy (if any) |
| -------- | ----------------------- | -------------------- |
| H3 dashboard aggregate | **Yes** — `GET /stays/host/dashboard`; today KPIs; `payouts.available = 0`; messaging unavailable | — |
| H4 Action Center IA | Interaction = filter/scroll, not Confirm check-in | Live UI is `HostTodaySection`, not H4 filename `HostTodayActionCenter` |
| H5 web integration | Dashboard wires `HostTodaySection`, payouts, bookings, calendar, listings | Dead `HostTodayActionCenter` / `HostKpiSection` still on disk (unimported) |
| H6 Booking Center | Urgency classifier + filters + row → detail | Urgency labels use verb-like EN (“Check-in today”) |
| H7–H11 analytics/reviews | Analytics + reviews pages consume existing APIs | Occupancy still BOOKED_NIGHTS / capacity styles; footnoted |
| H12 ops integrity | Re-verified | **Confirmed:** no mark-check-in API; payout Available/Paid out omitted on dashboard UI; `canList` drift **still present**; dead components **still present** |

Where code and older host docs disagree (e.g. `docs/host-dashboard.md` still describing `HostTodayActionCenter` as live): **report only** — neither code nor those docs were changed in H13.

---

## 4. Today / Action Center Audit

### Live surface

- **Canonical:** `components/host/HostTodaySection.tsx`  
- **Dead (not imported by app):** `HostTodayActionCenter.tsx`, `HostKpiSection.tsx` (only referenced in docs / themselves)

### Informational vs executable

| Item | Class | Notes |
| ---- | ----- | ----- |
| Metric tiles (check-ins/outs, staying, new, payment) | **INFORMATIONAL** | Non-interactive `<div>` tiles |
| “{n} check-ins today” row | **FILTER** (+ scroll) | `<button>` → `onOpenBookings('checkin_today')` + `#host-bookings` |
| “{n} check-outs today” | **FILTER** | `checkout_today` |
| “{n} awaiting guest payment” | **FILTER** | `awaiting_payment` — no collect API |
| Calendar issue row | **SCROLL** / nav to panel | `#host-calendar-sync` — sync UI is real |
| Listing health / missing label | **SCROLL** | `#host-listings` — remediation = edit listing elsewhere |
| Check-outs tomorrow / new bookings | **SCROLL**/filter-ish | Bookings section; tomorrow has no dedicated filter when only tomorrow |
| Empty: “You're all caught up for today.” | **INFORMATIONAL overclaim** | Only proves no rows in this chip list |

### CTA / framing semantics

- Section intro: EN `todayActionsDesc` = **“What needs your attention right now.”**  
- Critical rows use **amber `AlertTriangle`** — strong action-queue visual.  
- Trailing text says View bookings / Calendar sync / View listings — **partial honesty**.  
- Does **not** label rows “Confirm check-in” or mutate booking status.

### Question answers

1. Informational: metric grid + empty-state line.  
2. Executable (mutation): **none** in this section.  
3. Imply action without API: **yes** — attention + button chrome + check-in language (severity by “View bookings”).  
4. Check-in today imply confirmation workflow? **Risk yes (EN)**; behavior is filter only.  
5. Check-out today imply confirmation? **Same risk**; backend auto-completes via scheduler.  
6. Awaiting payment imply chase/collect? **Moderate risk**; filter only.  
7. Calendar issue → real calendar management? **Yes** (panel + real sync APIs); hash deep-link incomplete (see §13).  
8. Listing health → actual remediation? **Partial** — scrolls to listings list; edit is a further navigation.  
9. “Caught up” overclaim? **Yes** — see §12.  
10. Dead components referenced? **On disk + docs only**; **not imported** by live dashboard.

---

## 5. Check-in / Check-out Honesty

### Backend capabilities (verified)

| Capability | Exists? | Evidence |
| ---------- | ------- | -------- |
| Host mark check-in endpoint | **No** | No controller route / service method for host mark-check-in |
| Host mark check-out endpoint | **No** | Same |
| Host “confirm arrival” API | **No** | — |
| Booking status mutation for host check-in | **No** | Host cancel exists separately on booking detail |
| Scheduler-driven completion | **Yes** | `booking-lifecycle-scheduler.service.ts` sets `COMPLETED` after checkout time / past stays |
| Lifecycle / urgency from dates + status | **Yes** | H3 today counts; H6 `classifyHostBookingUrgency` |

`CHECKED_IN` appears in eligible status sets and seeds/tests; production stay completion does **not** require a host check-in write.

### Label classification

| UI wording (EN) | Source field / logic | Endpoint (read) | Executable? | Trust risk | Severity |
| --------------- | -------------------- | --------------- | ----------- | ---------- | -------- |
| “Check-ins today” (metric) | `today.checkins_today` | `GET /stays/host/dashboard` | No | Low–med | P2 |
| “{count} check-ins today” (action row) | same | same + filter | No (FILTER) | Med — looks operational | **P1** |
| Badge “Check-in today” | `classifyHostBookingUrgency` | host bookings list | No | Med (verb-like) | **P1** |
| “Check-outs today” / badge | `checkouts_today` / urgency | dashboard + list | No | Med | P1–P2 |
| “Currently staying” / “Staying” | `currently_staying` / urgency | same | No | Low | INFO |
| “Upcoming” / “Completed” | status + dates | bookings | No | Low | INFO |
| “Awaiting payment” | `awaiting_guest_payment` / `PAYMENT_PENDING` | same | No chase | Med | P2 |

**Rule applied:** date-based urgency ≠ executable action without a mutation API.

---

## 6. Payout Honesty

### Surfaces

| Surface | What is shown | What is omitted / risky |
| ------- | ------------- | ----------------------- |
| `HostPayoutStatus` | `pending`, provider/mode, `payoutWalletNotEnabled`, amber disclaimer | **`available`, `paid_out` not rendered** despite H3 fields |
| Dashboard aggregate | API returns pending / available=0 / paid_out (SETTLED sum) | UI incomplete triad |
| Booking detail | `hostBooking.payoutHint` timing copy | Promises release timing |
| Analytics | Earnings / period nets (not wallet) | Not a withdraw UI |

### Ledger vs UI (backend contracts)

| Concept | Backend truth | UI honesty |
| ------- | ------------- | ---------- |
| `pending` | Σ `HOST_PAYOUT` + `PENDING` | Shown when > 0 |
| `available` | **Hardcoded `0`** (no wallet) | **Not shown** on dashboard panel |
| `paid_out` | Σ `HOST_PAYOUT` + `SETTLED` (typically 0; no settlement job that flips HOST_PAYOUT to SETTLED in normal flow) | **Not shown** on dashboard panel |
| Withdraw / wallet | Explicitly not enabled | Copy admits wallet not enabled — **good** |
| CMI settlement | Not host-ops enabled as wallet | Not presented as available balance |

### Flagged wording (unsupported vs ledger / product)

| Exact copy | Locale | Support? |
| ---------- | ------ | -------- |
| “Your payout is released 24 hours after the guest checks in.” | EN `hostBooking.payoutHint` | **Unsupported** settlement promise |
| “Votre versement est libéré 24 h après l'arrivée du voyageur.” | FR | Same |
| “يُصرف دفعك بعد 24 ساعة من وصول الضيف.” | AR | Same |
| “Withdrawal wallet is not enabled yet.” | EN dashboard | **Supported** honesty |

No withdraw button found on host dashboard payout panel. Wallet icon is decorative framing only.

---

## 7. Action vs Navigation Integrity

| Surface | Label | Type | Backend endpoint | Mutation? | Destination | Truth risk | Severity |
| ------- | ----- | ---- | ---------------- | --------- | ----------- | ---------- | -------- |
| Today | Check-ins today row | FILTER | Dashboard read + client filter | No | Booking Center `checkin_today` | Looks actionable | P1 |
| Today | Check-outs today row | FILTER | same | No | `checkout_today` | Same | P1 |
| Today | Awaiting payment row | FILTER | same | No | `payment_pending` / awaiting filter | Implies chase | P2 |
| Today | Calendar issue | SCROLL | Calendars API (panel) | No at row; sync later | `#host-calendar-sync` | Low if sync used | INFO–P2 |
| Today | Listing health | SCROLL | Listings / completion | No | `#host-listings` | Partial remediation | P2 |
| Today | Metrics | INFORMATIONAL | Dashboard | No | — | Low | INFO |
| Booking row | “View booking” | NAVIGATION | `GET` booking | No | `/bookings/:id` | Low | INFO |
| Booking detail | Cancel (host) | EXECUTABLE ACTION | cancel booking API | **Yes** | self | AuthZ must hold | INFO |
| Booking detail | Message | EXECUTABLE ACTION | messaging APIs | **Yes** | inbox/thread | OK | INFO |
| Booking detail | Call | NAVIGATION | `tel:` | No | device dialer | OK | INFO |
| Booking Center | CSV export | EXECUTABLE ACTION (client) | local export | Client-only | download | OK | INFO |
| Calendar panel | Sync / pause / delete / export | EXECUTABLE ACTION | external calendar endpoints | **Yes** | panel | OK | INFO |
| Listings | Pause/resume / edit | EXECUTABLE ACTION / NAV | listing APIs | Yes where wired | listing flows | OK | INFO |
| Reviews links | View reviews | NAVIGATION | `GET /stays/host/reviews` | No | reviews page | OK | INFO |
| Payout panel | (amounts) | INFORMATIONAL | dashboard payouts | No | — | Incomplete triad | P2 |
| Dashboard messaging KPI | — | UNAVAILABLE | messaging.status unavailable | No | — | Correctly withheld | INFO |

---

## 8. Booking Center Audit (H6 — no modifications)

### Verified behavior

- Urgency = client classifier on status + Casablanca date YMD (`lib/host-booking-center.ts`).  
- Badges are **labels**, primary CTA is **View booking** (not Confirm).  
- Filters mirror urgency classes (`checkin_today`, `checkout_today`, `awaiting_payment`, etc.).  
- Cancel / message live on **detail**, not as fake queue actions on Today.  
- CSV export is client-side list export.  

### Integrity

| Check | Result |
| ----- | ------ |
| Urgency masquerading as action state | **Partial** — badge wording EN is action-flavored; control is not a mutation |
| Lifecycle labels vs backend | Aligns with status + dates; scheduler completes without host checkout mark |
| Host cancel AuthZ | Host cancel path exists on booking detail (`viewer_role === HOST`) |
| Unavailable actions as buttons | No Confirm Check-in button observed |
| Today filters Casablanca | Same day math family as H3/H6 tests |

---

## 9. Calendar / Availability Honesty

| Concern | Finding |
| ------- | ------- |
| ERROR attention | H3 `calendar_status.listings_needing_attention` from external calendar ERROR — **authoritative** |
| Sync action | `HostCalendarSyncPanel` → `syncExternalCalendar` — **real endpoint** |
| Export | Copy/regen export URL — **real calendar mechanism** |
| Availability blocks vs occupancy | Occupancy footnote: **“Blocks are not deducted.”** — honest BOOKED_NIGHTS / capacity style |
| Bookable implication | Calendar healthy ≠ every night bookable; product does **not** claim full true-available-night occupancy on dashboard KPI |
| BOOKED NIGHTS vs TRUE AVAILABLE INVENTORY | **Distinguished in footnotes, not in headline KPI name** — residual education risk (P2/INFO) |

---

## 10. Listing Health Honesty

| Claim type | Present in live UI? |
| ---------- | ------------------- |
| Completion % / missing fields | **Yes** — `listing_health`, analytics `health.completion_percentage` |
| Pause / resume / status | Listing status surfaces exist |
| Invented “quality score” | **Not found** |
| “Best listing” / “fully bookable” / “payment ready” / “guaranteed ready” | **Not found** as composite scores |
| Composite health beyond completion + calendar status flags | Analytics `health.attention` derived from real signals (H10/H11) — not a fake score |

Today listing row may show first missing **label** from API — factual, navigates to listings section.

---

## 11. Verification / AuthZ Audit

### Web gate

- Host dashboard / reviews / analytics gate on host verification/application **APPROVED** via status fetch + `ProtectedRoute`.  
- Listing create/edit similarly behind auth + host gates.

### `canList` drift — re-check vs H12

| Path | Behavior |
| ---- | -------- |
| `HostsService.canList` | `return this.hostOnboarding.isApprovedHost(userId)` → **`application_status === 'APPROVED'` only** |
| `HostOnboardingService.canList` | Requires `application_status === 'APPROVED'` **and** `host_verification_status === 'APPROVED'` **and** `!listing_frozen` |

**Classification: confirmed** (drift still exists).  
H13 does **not** patch it (audit finding only). Severity remains **P1** AuthZ consistency (backend hardening later).

---

## 12. Reviews / Messaging Honesty

| Forbidden invention | Host ops UI status |
| ------------------- | ------------------ |
| Review replies / response buttons | **Absent** on H9 host reviews |
| Unread review counts / needs-response badges | **Absent** |
| Dashboard messaging unread inventing | H3 `messaging.status = unavailable` — **not invented** |
| Fake conversations as ops state | **Not present** on dashboard Today |

Review reading remains **read-only**. Links say “View reviews” semantics.

---

## 13. Empty-State Audit

| Surface | Exact / conceptual empty copy | Overclaim? |
| ------- | ----------------------------- | ---------- |
| Today | EN: “You're all caught up for today.” FR: “Vous êtes à jour pour aujourd'hui.” AR: “أنت على اطلاع بكل شيء اليوم.” | **Yes** — proves no Today attention chips only; not payout/calendar-outside-count/listing/review/future booking health |
| Payout | “No pending payout” when pending=0 | Narrow — OK if limited to pending |
| Booking filters | Filter-specific empty strings | Generally scoped — OK |
| Reviews empty | Empty reviews state | OK if limited to no reviews |
| Analytics empty / N/A | Period empty / occupancy N/A for `all_time` | H11 honesty intact |

**Top overclaim:** Today all-clear green check + absolute “caught up” / “à jour” / “على اطلاع بكل شيء”.

---

## 14. Navigation / Deep-Link Audit

| Source | Destination | Correct? |
| ------ | ----------- | -------- |
| Today check-in | Booking filter `checkin_today` + `#host-bookings` | **Yes** (in-session) |
| Today checkout | `checkout_today` | **Yes** |
| Payment pending | awaiting payment filter | **Yes** |
| Calendar issue | `scrollToId('host-calendar-sync')` | **Yes** for in-page scroll |
| Hash on load | Only `#host-bookings` and `#host-listings` allowed | **`#host-calendar-sync` not in hash allowlist** — deep-link gap **P2** |
| Listing health | `#host-listings` | **Yes** scroll |
| Reviews / analytics | Dedicated locale routes | **Yes** |
| Booking row | Locale booking detail | **Yes**; ArrowRight uses `rtl:rotate-180` |

Locale prefixes: App Router `[locale]` — destinations remain under active locale when using app links.

---

## 15. Mobile Audit (report only)

| Risk | Observation |
| ---- | ----------- |
| Payout disclaimer hidden | Disclaimer remains below grid (`text-xs`); not removed on mobile layout — **visible but dense** |
| Info rows look like action buttons | Today rows are full-width buttons on all breakpoints — **same ambiguity** |
| Label collapse | Metric labels `text-xs`; possible truncation on narrow widths — watch |
| Ambiguous tap targets | Entire Today row is one tap (filter/scroll) — intentional but action-like |
| Extra mobile-only mutations | **None observed** vs desktop for Today |

No redesign performed.

---

## 16. i18n / RTL Honesty

| Key theme | EN | FR | AR | Meaning drift? |
| --------- | -- | -- | -- | -------------- |
| Today intro | attention | attention | انتباه | Parallel “attention” framing |
| All clear | caught up | à jour | على اطلاع بكل شيء | AR slightly broader (“everything”) — overclaim |
| Action check-ins | “check-ins today” | “arrivées aujourd'hui” | “وصول اليوم” | FR/AR more arrival-neutral than EN verb “Check-in” |
| Urgency badge check-in | “Check-in today” | “Arrivée aujourd'hui” | “وصول اليوم” | EN strongest action implication; **no “confirm” invented** |
| Payout hint 24h | present | present | present | Parallel **unsupported timing** |
| Wallet not enabled | present | portefeuille de retrait | محفظة السحب | Parallel honesty |

RTL: booking row `ArrowRight` rotates — semantic direction OK. No translation audited that turns “view” into “confirm”.

---

## 17. Source-of-Truth Matrix

| Concern | UI Surface | Current Source | Endpoint | Authoritative? | Executable? | Trust Risk |
| ------- | ---------- | -------------- | -------- | -------------- | ----------- | ---------- |
| check-in | Today + badges | Date + CONFIRMED/CHECKED_IN | `GET /stays/host/dashboard`, bookings | As date KPI yes | **No** | P1 wording |
| checkout | Today + badges | Date + status | same | Yes as date KPI | **No** (scheduler completes) | P1–P2 |
| staying | Today / urgency | Date window + status | same | Yes | No | Low |
| awaiting payment | Today / filter | PAYMENT_PENDING lifecycle | same | Yes | No chase | P2 |
| cancellation | Booking detail | Host cancel API | cancel booking | Yes | **Yes** | Low |
| messaging | Detail / inbox | Messaging APIs; dashboard unavailable | messaging | Yes | Yes on detail; unavailable KPI | Low if no invent |
| calendar | Sync panel + Today | External calendars ERROR/ACTIVE | calendar APIs + H3 | Yes | Sync yes | Low |
| listing completion | Listings / health | `listing-completion` flags/% | listings + H3 | Yes | Edit listing | Low |
| listing status | Listings | Listing status fields | listings | Yes | Pause/resume where wired | Low |
| payout pending | HostPayoutStatus | HOST_PAYOUT PENDING | H3 | Yes | No | Low |
| payout available | (API only) | Hardcoded 0 | H3 | Honesty field | No | UI omit P2 |
| payout paid_out | (API only) | SETTLED HOST_PAYOUT | H3 | Field yes; rarely non-zero | No | UI omit + hint P1–P2 |
| reviews | Host reviews page | Host reviews API | `GET /stays/host/reviews` | Yes read-only | No reply | Low |
| analytics health | Analytics | H10 nested health | `GET /stays/host/analytics` | Derived authentic signals | Navigate | Low |
| verification | Dashboard gate | Host verification status | verification GET | Yes for web gate | — | canList drift P1 |
| availability | Calendar / guest search | Blocks + bookings | availability services | Yes for search | — | KPI ≠ true inventory |
| occupancy | Snapshot / analytics | BOOKED nights formulas | H3/H10 | Authoritative **for named basis** | No | Misread as true avail P2 |

---

## 18. Findings (P0 / P1 / P2 / P3 / INFO)

### P0

_None._ No false executable financial withdraw or host status mutation observed that would silently corrupt money/bookings in the Today UI.

### P1

1. **Today/Booking urgency language + button chrome** imply executable check-in/out ops without mutation APIs.  
2. **Booking detail `payoutHint` 24h release** unsupported by HOST_PAYOUT settlement behavior.  
3. **`HostsService.canList` vs `HostOnboardingService.canList` drift** — confirmed AuthZ inconsistency.

### P2

4. Today empty state **overclaims** “caught up / à jour / كل شيء”.  
5. Dashboard payout panel **omits available + paid_out** (H3 triad incomplete).  
6. Awaiting-payment attention may imply host collection capability.  
7. Hash deep-link **does not include** `host-calendar-sync`.  
8. Occupancy KPI can still be misread as true available inventory despite footnote.  
9. Listing health scroll ≠ one-click remediation of missing fields.

### P3

10. Dead `HostTodayActionCenter.tsx` / `HostKpiSection.tsx` still on disk.  
11. Older docs (`docs/host-dashboard.md`, H1/H2/H4 references) still describe dead components as primary UI.

### INFO

12. Messaging unread correctly unavailable on dashboard.  
13. Reviews remain read-only; no reply inventing.  
14. Calendar sync / cancel / message are real executable where presented.  
15. `available = 0` + wallet-not-enabled copy are intentional honesty on API/disclaimer side.  
16. FR/AR arrival wording is slightly more neutral than EN “Check-in”.

**Counts:** P0: **0** · P1: **3** · P2: **6** · P3: **2** · INFO: **5** (grouped themes above)

---

## 19. API Decision

# H13 API: EXISTING + UI ENHANCEMENTS

**Why this matches H12 and remains correct**

1. Authoritative reads already exist: H3 dashboard, host bookings, calendars, listings, reviews, analytics, cancel, messaging.  
2. Truth failures are primarily **copy, CTA classification, incomplete payout triad display, empty-state scope, hash allowlist, AuthZ drift** — not absence of an aggregate Action Center DTO.  
3. A new `GET /stays/host/actions` would re-package H3 date KPIs and increase risk of fake “actionable” semantics.  
4. Check-in write / wallet settle / review reply remain **product/domain** decisions — out of honesty-UI scope.

**Not** chosen: NEW API REQUIRED (for honesty).  
**May later require:** BACKEND HARDENING for `canList` (separate from UI honesty) and PRODUCT DECISION if true check-in confirm UX is desired.

---

## 20. Recommendation Matrix

| Recommendation | Category | Why | Surface | Source of truth | API change? | Backend change? | Product decision? | Priority |
| -------------- | -------- | --- | ------- | --------------- | ----------- | --------------- | ----------------- | -------- |
| Relabel Today rows / urgency badges as “arrivals / departures / review bookings” (match FR/AR neutrality); demote amber “action queue” chrome or annotate “View only” | **UI-only** | Reduce false executable implication | Today + badges | H3 dates | No | No | Soft copy product OK | P1 |
| Narrow empty copy to “No attention items in Today” | **UI-only** | Stop overclaim | Today | Chip list only | No | No | Copy | P2 |
| Show `available` (0) + `paid_out` with existing disclaimer | **UI-only** / Existing API | Complete H3 triad honestly | HostPayoutStatus | H3 payouts.* | No | No | No | P2 |
| Replace/remove 24h payoutHint until settlement exists | **UI-only** (+ product) | Unsupported financial promise | Booking detail | Ledger reality | No | No unless settle ships | Yes if timing claimed | P1 |
| Add `#host-calendar-sync` to hash allowlist | **UI-only** | Deep-link parity | dashboard page | DOM id exists | No | No | No | P2 |
| Route HostsService.canList through onboarding canList | **Backend hardening** | AuthZ consistency | listing create gates | Onboarding canList | No new API | **Yes** | Clarify freeze/KYC rules | P1 |
| Remove or quarantine dead HostTodayActionCenter/KpiSection | **UI-only** (cleanup) | Editor confusion | components | Live = HostTodaySection | No | No | No | P3 |
| Do not invent check-in confirm until product + API | **Intentionally unavailable** | No backend mutation | Today | — | Would need new | Would need new | **Required first** | — |
| Do not invent withdraw / CMI wallet UX | **Intentionally unavailable** | available=0 | Payouts | H3 | No | Future domain | Yes | — |
| Do not invent review reply / unread ops | **Intentionally unavailable** | H8/H9 lock | Reviews | Host reviews GET | No | Future | Yes | — |
| True blocks-aware occupancy | **Product decision** + domain | KPI education vs rewrite | Snapshot/analytics | Occupancy basis enums | Maybe later | Yes for true avail | Yes | P2/P3 |
| New Action Center aggregate API | **Intentionally unavailable** now | Not needed for honesty | — | H3 already | Only if new executable states | — | Only then | — |

---

## 21. Explicit Non-Goals

H13 does **not**:

- create `GET /stays/host/actions`  
- create check-in / check-out host endpoints  
- create review reply or unread messaging inventing  
- create wallet / withdraw APIs or enable CMI settlement  
- change payout ledger semantics or occupancy formulas  
- introduce composite listing scores  
- change H3 / H6 / H9 / H10 / H11 contracts  
- fix `HostsService.canList`  
- remove dead components  
- modify Identity/KYC architecture  
- alter database schema  
- implement any recommendation above  

---

## 22. Exact Next-Phase Recommendation

**Recommended next phase: H14 — Host Operations Honesty UI Enhancements (UI-only, authorized separately)**

Suggested order:

1. Copy + visual reclassification of Today FILTER rows and EN urgency badges (P1).  
2. PayoutHint honesty + optional Available/Paid out display (P1/P2).  
3. Today empty-state scope + calendar hash deep-link (P2).  
4. Separate ticket: backend `canList` hardening (not UI).  
5. Defer: check-in confirm API, wallet, review replies, Action Center mega-API.

Only after explicit authorization to implement. H13 itself remains audit-only.

---

## 23. Implementation Status

| Item | Status |
| ---- | ------ |
| H13 audit | **COMPLETE** |
| Application code changes | **NONE** |
| Backend changes | **NONE** |
| i18n / tests / schema | **NONE** |
| API decision | **LOCKED: EXISTING + UI ENHANCEMENTS** |
| H14+ implementation | **NOT STARTED · NOT AUTHORIZED by this document** |

### Final verification checklist (for committers)

1. `git status --short` → only this markdown.  
2. `git diff --stat` → docs only.  
3. No Prettier/format sweep on source.  
4. Commit must contain **only** `docs/host/H13_HOST_OPERATIONS_HONESTY_UI_AUDIT.md`.

---

**H13 complete:** AUDIT COMPLETE · API DECISION LOCKED · IMPLEMENTATION NOT STARTED
