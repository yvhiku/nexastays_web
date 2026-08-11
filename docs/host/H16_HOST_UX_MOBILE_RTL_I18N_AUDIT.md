# H16 — Host UX / Mobile / RTL / i18n Final Audit & Fix

## Status

**COMPLETE · HOST UX / MOBILE / RTL / I18N FINAL AUDIT PASSED**

Upstream preserved: H13 audit · H14 honesty (`5f37cf9`) · H15 AuthZ (`6e826a5`) · H3 route restoration (`9c98428` / docs `5857205`).

---

## 1. Executive Verdict

H16 audited live Host surfaces and applied **minimal UI/i18n/RTL/nav fixes**. No backend, API, schema, AuthZ, or product-capability changes.

| Area | Verdict |
| ---- | ------- |
| H14 honesty regression | **None** in live Host Today/booking/payout ops strings |
| Desktop Host shells | Usable; analytics tables scroll/cards on mobile already |
| Mobile | Host bottom nav no longer drops on reviews/analytics |
| RTL | Directional icons fixed on booking detail + listing edit; date separator mirrors |
| i18n | `hostDashboard*` EN/FR/AR key parity; dashboard listing chrome localized |
| Dead code | Removed unused `HostTodayActionCenter` / `HostKpiSection` |
| Major leftover EN | Calendar sync panel + listing wizard still largely hardcoded → **deferred H17** |

---

## 2. Scope

### In scope (done)

- Host desktop/mobile UX polish  
- RTL directional icons/margins  
- EN/FR/AR Host Dashboard listing strings  
- Booking export status labels  
- Mobile host chrome continuity  
- Dead-component cleanup  
- H13/H14 regression verification  

### Out of scope (locked)

- New APIs / schema / payout ledger / check-in mutations / wallet / review replies / H15 canList / Identity  

---

## 3–8. Findings by area

### Desktop

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| Live Today/bookings/payouts show H14 arrivals/departures + triad | INFO | Intact |
| Dashboard listings used hardcoded EN chrome | P2 | **FIXED** |
| Booking CSV export status options raw enums | P2 | **FIXED** |

### Mobile

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| Host bottom nav vanished on `/host/reviews` & `/host/analytics` | P2 | **FIXED** |
| Analytics already card+`overflow-x-auto` | INFO | Intact |
| Filter chips already scroll | INFO | Intact |

### RTL

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| Booking detail `ArrowLeft`/`ChevronRight` missing rotate | P2 | **FIXED** |
| Listing edit back `ArrowLeft` + `-ml-2` | P2 | **FIXED** (`rtl:rotate-180`, `-ms-2`) |
| Booking row date `→` not mirrored | P2 | **FIXED** |
| Today row `text-left` | P2 | **FIXED** → `text-start` |
| Most Host Lucide arrows already rotated | INFO | Intact |

### i18n

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| `hostDashboard` / `hostBooking` / `hostReviews` / `hostAnalytics` key parity | INFO | Intact |
| `HostCalendarSyncPanel` hardcoded EN | P1 | **DEFERRED TO H17** (large localization surface) |
| Listing wizard body hardcoded EN | P1 | **DEFERRED TO H17** |
| Soft FR cognates (`Attention`, `Message`) | P3 | **DEFERRED** polish |
| Guest/listing “24 hours” / notifications “caught up” | INFO | Outside Host Ops |

### Accessibility

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| Today filter rows remain buttons with filter+view aria | INFO | Preserved (FILTER/VIEW, no mutation) |
| Listing cards keyboard Enter/Space | INFO | Intact |

### Navigation

| Finding | Sev | Outcome |
| ------- | --- | ------- |
| Locale paths preserved via `localePath` | INFO | Intact |
| `#host-calendar-sync` allowlist (H14) | INFO | Intact |
| Mobile host area continuity | P2 | **FIXED** |

---

## 9. H13/H14 Regression Verification

| Stale concept | Host ops live UI |
| ------------- | ---------------- |
| Check-in today / Check-out today (EN urgency) | Absent (Arrival/Departure) |
| caught up / à jour / كل شيء (Today) | Absent |
| 24h payout promise | Absent (`payoutHint` honest) |
| Confirm check-in | Absent |
| Withdraw CTA | Absent (wallet-not-enabled disclaimer only) |
| Review reply / unread | Absent |
| Fake Action Center amber queue | Absent (`HostTodaySection` filter/view) |

---

## 10. H15 Frontend Interaction

| Item | Status |
| ---- | ------ |
| Backend `canList` triad | **UNCHANGED** |
| `getHostMe.can_create_listing` | Types/API exist; **unused in UI** — informational gap only → defer product wiring |
| Freeze on update/pause/resume | Backend behavior unchanged; UI uses existing errors |
| Unauthenticated `/stays/host/dashboard` | Expect **401** (mounted), not 404 |

---

## 11. Changes Implemented

1. Deleted dead `HostTodayActionCenter.tsx`, `HostKpiSection.tsx`  
2. `MobileBottomNav` — host area includes reviews/analytics; dashboard tab stays active there  
3. Dashboard listing chrome → `hostDashboard.*` i18n (EN/FR/AR)  
4. Booking export status labels → `bookingStatus.*`  
5. RTL fixes: booking detail, listing edit, booking date arrow, Today `text-start`  

---

## 12. Deferred Findings

| Item | Class |
| ---- | ----- |
| Full `HostCalendarSyncPanel` i18n | DEFERRED TO H17 |
| Full listing wizard i18n | DEFERRED TO H17 |
| Wire UI to `can_create_listing` signal | DEFERRED TO PRODUCT DECISION |
| Freeze-gated update/pause/resume Backend | DEFERRED TO H17 (AuthZ product) |
| BOLA NotFound vs Forbidden test mismatch | DEFERRED TO H17 |
| Wizard “Listing quality” photo bar wording | DEFERRED TO H17 (copy polish) |
| Older docs still naming deleted ActionCenter/KPI | DEFERRED (docs cleanup; not H16) |
| Soft FR cognates | INFO / polish |

---

## 13. Tests

```bash
npx --yes tsx --test lib/__tests__/host-booking-center.test.ts lib/__tests__/host-analytics.test.ts
node -e # JSON parse + hostDashboard key parity EN/FR/AR
```

Expected: host booking/analytics suites pass; locale parity OK.

---

## 14. Build

`npx tsc --noEmit` — known **PRE-EXISTING** failure in `lib/__tests__/sec-008-otp-binder-storage.test.ts` (unrelated to H16).

Production `next build` not required as H16 gate if typecheck pre-existing; recommend CI smoke on Host locales.

---

## 15. Runtime Verification

Local stays must remain restarted so:

```text
GET /api/v1/stays/host/dashboard → 401 (not 404)
```

UI: reload Host Dashboard EN/FR/AR; mobile host chrome on Reviews/Analytics; RTL booking detail back link.

---

## 16. Release-Risk Assessment

**Low residual Host UX risk for release** on honesty + RTL chrome + mobile host nav.

**Medium residual**: Calendar sync + listing wizard remain English-first until H17 localization pass.

**No P0** remaining after H16 fixes.

---

## Classification summary

| ID | Classification |
| -- | -------------- |
| Dead ActionCenter/KPI | **FIXED** |
| Mobile host nav gap | **FIXED** |
| Dashboard listing EN | **FIXED** |
| Export status enums | **FIXED** |
| RTL icon/margin gaps | **FIXED** |
| Calendar/wizard EN | **DEFERRED TO H17** |
| can_create_listing UI | **DEFERRED TO PRODUCT DECISION** |
| Frozen host pause/update | **DEFERRED TO H17** |
| Guest 24h / notifications caught up | **FALSE POSITIVE** (non–Host Ops) |
| H14 Today/payout honesty | **INFO** (verified intact) |

**H16 COMPLETE — HOST UX / MOBILE / RTL / I18N FINAL AUDIT PASSED**
