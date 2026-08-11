# H17 — Host Production Readiness / Security / Regression Audit

## 1. Status

**COMPLETE WITH BLOCKERS REMEDIATED · READY FOR H18 EVALUATION**

H17 audited current code after H13–H16 + H3 route restoration, remediating confirmed AuthZ gaps, and documenting deferred risk for H18.

**Not** a production GO/NO-GO. That remains **H18**.

---

## 2. Executive Verdict

| Dimension | Verdict |
| --------- | ------- |
| Authentication (JWT on Host routes) | **Adequte** — method-level `JwtAuthGuard` on host mutations/reads |
| Authorization (`canList` triad) | **Hardened in H15 + H17** — create/submit/resume/update/media/units gated |
| Ownership / BOLA | **Hardened** — listings now anti-enumerate (`NotFound`); calendar already NotFound |
| H14 honesty | **Intact** (code-audited) |
| H3 dashboard route | **Mounted** when process is current (401 without token — not 404) |
| Frontend | **No P0**; client gates are UX-only; backend authoritative |
| Remaining for H18 | Calendar/availability while frozen; wizard/calendar i18n; OTP tsc pre-existing; ops restart hygiene |

**H17 production readiness for Host AuthZ core:** improved and test-backed.  
**H18 must still** weigh deferred P2 items and deployment process hygiene.

---

## 3. Baseline audited

| Repo | HEAD at audit start |
| ---- | ------------------- |
| Web (`nexastays_web`) | `80ed136` (H16) |
| Backend (`nexastays_backend`) | `9c98428` (H3 route test) / prior H15 `6e826a5` |

H17 remediations land in a subsequent backend (+ web docs) commit(s) on top of this baseline.

---

## 4. H13–H16 contract verification

| Phase | Contract | Status |
| ----- | -------- | ------ |
| H13 | No fake Action Center API / check-in write / wallet / review reply / 24h SLA invent | **Verified** (code) |
| H14 | Arrivals/departures, payout triad, scoped empty, calendar hash, EN/FR/AR | **Verified** (H16 + re-read `HostTodaySection` / `HostPayoutStatus` / locales) |
| H15 | `HostsService.canList` → onboarding triad | **Verified** |
| H16 | Mobile host nav, RTL icons, dead ActionCenter deleted | **Verified** |
| H3 | `GET /api/v1/stays/host/dashboard` exists; unauth → auth fail not 404 | **Verified** in prior runtime + route registration tests |

---

## 5. H3 route verification

| Check | Evidence |
| ----- | -------- |
| Source route | `StaysController` `@Get('host/dashboard')` + `@Controller('stays')` + global `api/v1` |
| Dist decorators | `stays.controller.h3-routes.spec.ts` |
| Failure mode (stale process) | Documented in H3 restoration: old `node dist/main` → 404; restart → 401 |
| Unauthenticated | **401 expected** — not a routing failure |

---

## 6. Authentication audit

| Endpoint family | Guard | Notes |
| --------------- | ----- | ----- |
| Host listings CRUD/media/units/submit/pause/resume | `JwtAuthGuard` | Per-method |
| Host dashboard/stats/analytics/bookings/reviews | `JwtAuthGuard` | JWT `userId` only |
| Host calendar ops | `JwtAuthGuard` | |
| Public ICS `GET calendar/:token` | Public by design | Token capability URL |
| Unauthenticated Host API | 401 | Code + prior runtime |

Frontend `ProtectedRoute` is **not** security; SPA memory JWT + HttpOnly refresh (intentional).

---

## 7. Authorization audit (`canList`)

**Authoritative rule (unchanged):**

```text
application_status === APPROVED
AND host_verification_status === APPROVED
AND listing_frozen !== true
```

| Mutation | Before H17 | After H17 |
| -------- | ---------- | --------- |
| createListing | assertCanList | assertCanList |
| submitListing | assertCanList | assertCanList |
| resumeListing | **ownership only** | **assertCanList + ownership** |
| updateListing | ownership only | **assertCanList + ownership** |
| replaceListingMedia | ownership only | **assertCanList + ownership** |
| replaceListingUnitTypes | ownership only | **assertCanList + ownership** |
| pauseListing | ownership only | ownership only (intentional — reduce inventory) |
| Calendar connect/sync/… | ownership only | **Deferred H18** (P2) |
| Availability blocks | ownership only | **Deferred H18** (P2) |

`getHostMe.can_create_listing` / `can_publish_listing`: **aligned to triad** in H17 (was weaker).

---

## 8. BOLA / IDOR audit

| Surface | Ownership mechanism | Cross-host result |
| ------- | ------------------- | ----------------- |
| Host listings (read/mutate) | `requireOwnedListing` | **NotFound** (H17 unified) |
| Calendar | `assertListingOwner` / `getOwnedCalendar` | NotFound |
| Availability blocks | host_user_id match | NotFound |
| Bookings cancel | guest or listing.host_user_id + cancelled_by | OK |
| Dashboard / analytics / reviews | JWT → host_user_id listings | OK |
| Bookings export listing_id filter | AND host join | OK |

**Remediation:** production listings no longer return `403 Forbidden` (existence oracle). Spec `bola-listings.spec.ts` aligned.

---

## 9–15. Surface security (summary)

### Listings
Create/submit/resume/update/media/units gated; pause ownership-only; uploads path-scoped to JWT (canList not required for upload blob — residual P2).

### Bookings
Host bookings scoped; cancel ownership OK; no host check-in mutation exposed.

### Calendar
Ownership OK; ICS URL validated via `validateOutboundHttpsUrl` / outbound fetch (SSRF controls **present**). canList not applied to sync while frozen → deferred.

### Reviews
Read-only host list scoped to own listings; no reply API invention.

### Analytics
JWT host listings only; no client hostId.

### Payouts
Dashboard aggregate from own ledger rows; UI honesty intact (no withdraw).

### Dashboard
`getHostDashboard(user.userId)` — no client hostId.

---

## 16. Frontend security

| Topic | Result |
| ----- | ------ |
| Token storage | Memory access + HttpOnly refresh |
| Host APPROVED gate | Client UX; APIs authoritative |
| `can_create_listing` UI | Unused before H17; API signal now accurate |
| XSS `dangerouslySetInnerHTML` in host | None |
| H14 honesty regression | None |
| Calendar ICS FE validation | Defense-in-depth gap (backend validates) — P2 INFO |
| NEXT_PUBLIC secrets | URLs/flags only; verify script for prod |

---

## 17. Input validation

DTO whitelist/`ValidationPipe` global; calendar ICS outbound URL validation exists; host cancel binds role to cancelled_by.

---

## 18. Sensitive-data exposure

Host booking responses include guest fields needed for ops (intentional). Calendar `last_error` may echo fetch diagnostics (P3). No FE stack traces on 5xx (user-safe messages).

---

## 19. Deployment / runtime audit

| Risk | Status |
| ---- | ------ |
| Stale `node dist/main` after rebuild | **Documented ops hazard** (H3) — restart required |
| `npm start` = build && node | Correct |
| Prod localhost in NEXT_PUBLIC | Blocked by `resolvePublicServiceUrl` when NODE_ENV=production |
| Debug swagger | Disabled in prod unless `ENABLE_SWAGGER` |

---

## 20. CORS / browser

API owns CORS/credentials. Next CSP `connect-src` scoping intentional. Cookie host mismatch warning exists.

---

## 21. Rate-limit / abuse

Sensitive writes use throttle presets where applied (`SENSITIVE_WRITE_THROTTLE` on some routes). Host listing mutations rely primarily on JWT + canList — **no invented new limits in H17**. Gap report: uploads without canList (P2).

---

## 22. Regression matrix

| Check | Result |
| ----- | ------ |
| H14 wording / payout triad | Pass |
| H15 canList façade | Pass |
| H15 freeze bypass via resume | **Was fail → Fixed H17** |
| H16 mobile/RTL | Pass (code) |
| H3 route registration | Pass (tests) |
| OTP `tsc` `.ts` import | **PRE-EXISTING unrelated** |

---

## 23. Test matrix

| Command | Result |
| ------- | ------ |
| `jest` hosts.service / host-onboarding / host-listings.canlist / host-listings.h17-authz / bola-listings / h3-routes | **6 suites, 29 passed** |
| `tsx --test` web host-booking-center + host-analytics | **19 passed** (run in H17 session) |
| Unauth `GET .../host/dashboard` | **401** when process live |

---

## 24. Findings

| Sev | Count | Blocking H18? | Notes |
| --- | ----: | ------------- | ----- |
| P0 | 1→0 | Was yes | Frozen resume → LIVE (**fixed**) |
| P1 | 3→0 remediable | Was yes | update/media/units + getHostMe (**fixed**); residual calendar/blocks deferred as P2 |
| P2 | ~5 | Decide in H18 | Calendar/blocks while frozen; media upload without canList; FE ICS checks; SPA middleware optional |
| P3 | ~3 | No | Error text leakage; docs drift; soft i18n |
| INFO | many | No | Intentional public ICS; pause without canList; guest 24h copy |

---

## 25. Remediations performed

| Change | File |
| ------ | ---- |
| assertCanList on resume / update / media / unit-types | `host-listings.service.ts` |
| requireOwnedListing → NotFound for cross-host | same |
| getHostMe flags = triad | `host-onboarding.service.ts` |
| H17 authz + BOLA + getHostMe tests | `*.spec.ts` |

---

## 26. Deferred (H18 must evaluate)

1. Apply `canList` (or freeze check) to calendar connect/sync and availability blocks  
2. Media upload endpoints without canList  
3. Full calendar-sync + listing wizard i18n (H16)  
4. Ops: mandatory restart after dist rebuild / process watchdog  
5. Optional Next middleware for `/host/*` private paths  
6. Unrelated OTP binder `tsc` TS5097  

---

## 27. H18 prerequisites

- Review deferred P2 freeze-on-calendar/blocks policy  
- Confirm dogfood/prod stays process runs post-build artifact (no stale PID)  
- Confirm authenticated Host dashboard **200** with triad host in target env  
- Decide go/no-go on residual P2s  

---

## 28. Final production-readiness verdict

**READY FOR H18** (evaluation gate), with remediations applied and remaining items explicitly deferred.

Not a production release approval.

---

## 29. Implementation status

- Audit: **COMPLETE**  
- Remediations: **COMPLETE** (authorized scope)  
- H18: **NOT STARTED**  
- Production release: **NOT DECLARED**
