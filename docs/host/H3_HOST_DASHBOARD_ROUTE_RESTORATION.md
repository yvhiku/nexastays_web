# H3-BUG — Host Dashboard Route Restoration

## Status

**FIXED · H3 CONTRACT PRESERVED · H15 UNAFFECTED**

---

## Problem

Host Dashboard UI showed:

> Something went wrong  
> Not found. Cannot GET `/api/v1/stays/host/dashboard`

Frontend maps HTTP 404 → title **Not found** (`lib/errors.ts`) and surfaces the Nest/Express body message.

---

## Pre-H15 status

**This failure existed before H15.**

Evidence:

| Probe (before restart) | Result |
| ---------------------- | ------ |
| `GET /api/v1/stays/host/stats` | **401** (route mounted; JWT required) |
| `GET /api/v1/stays/host/bookings` | **401** |
| `GET /api/v1/stays/host/dashboard` | **404** Cannot GET |
| `GET /api/v1/stays/host/analytics` | **404** Cannot GET |

H15 only changed `HostsService.canList` (and tests). It does not register HTTP routes. A missing route (`Cannot GET`) is routing/runtime, not AuthZ (`401`/`403`).

---

## Root Cause

**Stale stays Node process loaded an older `dist/main` that predated H3/H10 route compilation.**

| Fact | Value |
| ---- | ----- |
| Process on `:3002` | `node dist/main` (PID observed `140260`) |
| Process start | **2026-08-11 16:05:35** |
| On-disk `stays.controller.js` with `Get('host/dashboard')` | **2026-08-11 20:55:38** |
| Source route | Present since commit `ec47ea1` (`@Get('host/dashboard')` on `StaysController`) |

Disk had the route; **memory did not**. Nest does not hot-reload `node dist/main` when `dist/` is overwritten by a later build.

Symmetric symptom: `host/analytics` (H10) also 404'd on the same stale process while older host routes still 401'd.

**Not caused by:** missing controller source, missing module registration, wrong global prefix, or H15.

---

## Frontend request (verified)

| Item | Value |
| ---- | ----- |
| Client | `lib/stays-api.ts` → `getHostDashboard()` |
| Relative path | `GET /stays/host/dashboard` |
| Base URL | `getStaysApiBaseUrl()` → default `http://localhost:3002/api/v1` |
| Final URL | **`http://localhost:3002/api/v1/stays/host/dashboard`** |
| Backend receiver | **stays** (port 3002), not identity (3001) |

---

## Backend route (verified in source)

| Item | Value |
| ---- | ----- |
| Controller | `StaysController` (`stays.controller.ts`) |
| Controller prefix | `@Controller('stays')` |
| Method | `@Get('host/dashboard')` + `JwtAuthGuard` |
| Global prefix | `API_PREFIX` default **`api/v1`** (`app.config.ts` / `main.ts`) |
| Runtime path | **`GET /api/v1/stays/host/dashboard`** |
| Service | `HostDashboardService.getHostDashboard` |
| Module | `StaysModule` → registered in `AppModule` |

Contract doc: `backend/stays/docs/host-dashboard-api.md`.

---

## Fix

1. Stop the stale stays process on port **3002**.  
2. Start stays from `backend/stays` with current dist: `node dist/main` (or `npm start` for full rebuild).  
3. Confirm unauthenticated probe:

| Route | Expected after fix |
| ----- | ------------------ |
| `/api/v1/stays/host/dashboard` | **401** (not 404) |
| `/api/v1/stays/host/analytics` | **401** (not 404) |

**Observed after restart:**

```text
host/stats      → 401
host/dashboard  → 401
host/analytics  → 401
host/bookings   → 401
host/reviews    → 401
```

4. Added regression test ensuring Nest decorators for H3/H10 routes remain on `StaysController`.

**No H3 contract redesign. No H15 canList changes.**

---

## H3 Contract

**PRESERVED** — existing aggregate DTO/service unchanged.

Fields used by the dashboard (`today`, `payouts`, `calendar_status`, `listing_health`, `messaging`, …) continue to come from `HostDashboardService.getHostDashboard`.

---

## H15 Interaction

**UNCHANGED** — authorization façade (`HostsService.canList` → onboarding triad) was not modified for this bug.

Route reachability ≠ listing AuthZ; once JWT is present, existing guards apply.

---

## Files changed

| Repo | File | Purpose |
| ---- | ---- | ------- |
| backend | `stays/src/modules/stays/stays.controller.h3-routes.spec.ts` | Guard against accidental route removal |
| web | `docs/host/H3_HOST_DASHBOARD_ROUTE_RESTORATION.md` | This record |

**Ops action (local):** restarted stays `node dist/main` (not a source edit).

---

## Tests

```bash
cd backend/stays
npx jest --runInBand src/modules/stays/stays.controller.h3-routes.spec.ts
```

Plus manual HTTP probes above (401 confirms mount).

`npx tsc --noEmit` on web: known unrelated failure in `sec-008-otp-binder-storage.test.ts` (pre-existing; not addressed).

---

## Remaining Issues

1. **Process hygiene:** after rebuilds that overwrite `dist/`, stays must be restarted or the same “new route → 404 / old route → 401” pattern will return.  
2. Authenticated **200** dashboard payload should be confirmed on the Host Dashboard UI after login (JWT).  
3. Production/dogfood deploy pipelines must restart the stays service after shipping H3/H10 builds.  
4. H16+ work unrelated; do not conflate with this ops fix.

---

## Final Verdict

**H3 DASHBOARD ROUTE RESTORED — H15 UNAFFECTED**
