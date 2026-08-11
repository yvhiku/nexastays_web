# H18 — Final Host Release Gate

## Status

**COMPLETE · HOST RELEASE GATE: GO (WITH ACCEPTED P2s)**

H18 is the independent final GO / NO-GO gate after H13–H17.  
It does **not** invent product capabilities. It evaluates evidence for Host production release readiness.

**Release criteria (locked for this gate):**  
**GO allowed if P0/P1 clear and deferred P2s are explicitly accepted.**

---

## 1. Executive Verdict

# **GO**

| Criterion | Result |
| --------- | ------ |
| Open P0 Host security defects | **None** (code + tests) |
| Open P1 Host security defects | **None** remediable remaining (calendar/blocks freeze treated as accepted P2) |
| H13–H16 honesty / UX contracts | **Hold** |
| H15 + H17 AuthZ | **Hold** (canList triad on create/submit/resume/update/media/units) |
| H3 dashboard / analytics routes | **Mounted** (unauth → **401**, not 404) |
| AuthZ / ownership / BOLA tests | **41 backend + 19 web passed** |
| Deferred P2s | **Explicitly accepted** for this GO (listed below) |

**Not claimed:** global Nexa platform GO, payment/CMI GO, or Identity KYC redesign GO — this gate is **Host product surface** only.

---

## 2. Baseline locked

| Artifact | Commit |
| -------- | ------ |
| Web HEAD | `f627464` (H17 docs) + prior H16 `80ed136` |
| Backend HEAD | `cb8944b` (H17 AuthZ/BOLA) |
| H15 | `6e826a5` |
| H16 | `80ed136` |
| H3 route restoration | `9c98428` |
| H14 honesty UI | `5f37cf9` |
| H13 audit | `9baa0ba` |

Working trees clean at gate time (docs-only commit for this file).

---

## 3. Phase checklist

| Phase | Required outcome | H18 check |
| ----- | ---------------- | --------- |
| H13 | Honesty audit; no fake Action Center API | **PASS** — no inventing APIs/mutations |
| H14 | Arrivals/departures; payout triad; scoped Today empty; no 24h payout SLA | **PASS** — `en.json` / components re-confirmed |
| H15 | canList triad façade | **PASS** — `HostsService.canList` → onboarding |
| H3 restore | `/api/v1/stays/host/dashboard` mounted | **PASS** — 401 unauth; registration tests |
| H16 | Mobile/RTL/i18n polish; dead ActionCenter removed | **PASS** — commit present; no honesty regression |
| H17 | Freeze resume / update / media / units gated; BOLA NotFound; getHostMe aligned | **PASS** — code + 29 AuthZ tests (+ dashboard suite) |

---

## 4. Security gate (P0/P1)

| Control | Evidence | Gate |
| ------- | -------- | ---- |
| Unauthenticated Host APIs | JwtAuthGuard; probe 401 | **PASS** |
| canList on create/submit | `assertCanList` | **PASS** |
| canList on resume/update/media/units | H17 `cb8944b` | **PASS** |
| Cross-host listing | `NotFoundException` | **PASS** |
| Dashboard/analytics host scope | JWT `userId` only | **PASS** |
| Cancel booking ownership | host_user_id + cancelled_by | **PASS** (H17 audit) |
| No fake check-in / withdraw / review reply | UI + API surface | **PASS** |
| ICS SSRF controls | `validateOutboundHttpsUrl` / outbound fetch | **PASS** (present) |

---

## 5. Runtime verification

| Check | Result | Evidence class |
| ----- | ------ | -------------- |
| `GET /api/v1/stays/host/dashboard` unauth | **401** | runtime-verified |
| `GET /api/v1/stays/host/analytics` unauth | **401** | runtime-verified |
| Host AuthZ unit suites | **41 passed** (7 suites incl. dashboard) | test-verified |
| Web host booking + analytics | **19 passed** | test-verified |
| Authenticated Host dashboard **200** | Not re-run with live host JWT in this gate | **not verified here** — required for deploy smoke |
| Stays process = post-H17 dist | Ops must restart after `cb8944b` deploy | **accepted ops P2** |

---

## 6. Accepted P2s (GO with acceptance)

These remain open and are **accepted** under the H18 criteria chosen for this gate:

1. **Calendar connect/sync / availability blocks** while frozen — ownership only; freeze does not yet block calendar inventory ops.  
2. **Media upload** endpoints without `canList` (path-scoped to JWT).  
3. **HostCalendarSyncPanel + listing wizard** largely English (H16 deferred i18n).  
4. **Stale `node dist/main` ops risk** — must restart stays after deploy/build (documented H3/H17).  
5. **SPA Host route protection** — client `ProtectedRoute` only; backend remains authoritative.  
6. **OTP binder `tsc` TS5097** — pre-existing, unrelated to Host production AuthZ.

Owner follow-ups recommended post-release or pre-hardening sprint — **not blocking this GO**.

---

## 7. Explicit non-goals (still unavailable)

Do **not** treat as incomplete Host GO:

- Host mark check-in / check-out  
- Wallet / withdraw / CMI settlement  
- Review replies / unread inventing  
- `GET /stays/host/actions` Action Center aggregate  
- Occupancy formula change  

---

## 8. Deploy smoke checklist (mandatory on target env)

Before flipping traffic:

1. Build stays → **restart** process (no stale PID).  
2. Unauth: dashboard/analytics → **401**.  
3. Auth eligible host: dashboard → **200** with H3 shape.  
4. Frozen host: resume → **400** frozen/canList denial.  
5. Cross-host listing id → **404**.  
6. Spot-check EN Today empty + payout triad; AR RTL back arrow.  

---

## 9. Tests executed for H18

```bash
# backend/stays
npx jest --runInBand \
  hosts.service.spec.ts \
  host-onboarding.service.spec.ts \
  host-listings.canlist.spec.ts \
  host-listings.h17-authz.spec.ts \
  bola-listings.spec.ts \
  stays.controller.h3-routes.spec.ts \
  host-dashboard.service.spec.ts
# → 7 suites, 41 passed

# nexastays_web
npx tsx --test lib/__tests__/host-booking-center.test.ts lib/__tests__/host-analytics.test.ts
# → 19 passed
```

---

## 10. Final release decision

# **HOST RELEASE: GO**

**Scope:** Nexa Stays **Host** web + stays Host APIs covered by H13–H17.  

**Conditions:**

- Accepted P2 list above remains knowingly open.  
- Deploy smoke checklist completed on the target environment.  
- Stays runtime restarted from current `cb8944b` artifact.

**H18 does not authorize** inventing missing product capabilities.

---

## Implementation status

- H18 audit / gate: **COMPLETE**  
- Further Host phases: **none required for this GO**  
- Production traffic: **operator decision** after deploy smoke  
