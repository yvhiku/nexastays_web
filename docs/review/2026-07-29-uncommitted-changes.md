# Code review — nexastays_web (uncommitted changes)

**Date:** 2026-07-29  
**Scope:** Working tree diff on `main` (61 files; not yet committed)  
**Baseline:** `2d232d8` (`fix(web): add controlled open state to DatePicker for booking flow`)  
**Verification run:** `npm test` (131 pass), `npm run lint` (pass), `npm run build` (pass)

---

## Summary

This changeset is a large production-hardening pass: cookie-based session refresh (JWT removed from `localStorage`), a minimal offline-only service worker, Next.js 16 / React 19 upgrade, SEO entity-graph JSON-LD, listings search UX alignment, and host wizard pricing/country normalization. The security direction is sound, but several integration edges will break or regress behavior in production unless addressed before merge.

---

## Findings

### [P0] Service worker script is locale-redirected — `middleware.ts:73-77`, `components/pwa/PwaAppShellCore.tsx:17`

`PwaAppShellCore` registers `/nexa-sw.js` with `{ scope: "/" }`, but middleware still rewrites non-excluded root paths to `/{locale}/…`. The matcher excludes `sw.js` and workbox assets, **not** `nexa-sw.js`.

A request to `/nexa-sw.js` is redirected to `/en/nexa-sw.js`, which does not exist as a static asset. Registration fails or installs a worker at the wrong URL, so offline fallback and `SwUpdateBanner` never work reliably.

**Fix:** Add `nexa-sw\\.js` to the middleware `matcher` exclusion list (alongside `sw\\.js`).

---

### [P1] KYC client refreshes (and may log out) on every 401 — `lib/kyc-api.ts:95-111`

The `jsonClient` 401 interceptor previously gated refresh on `hadAuth` / stored refresh token. The new code removes that guard and attempts `refreshTokenApi()` on **any** 401:

```typescript
if (err.response?.status === 401 && config && !config.__refreshRetried && typeof window !== "undefined") {
  {
    config.__refreshRetried = true;
    try {
      const tokens = await refreshTokenApi();
      // ...
    } catch {
      notifyAuthLogout();
    }
  }
}
```

An expected 401 on a pre-auth or expired-session call will hit `/auth/refresh`, fail without a cookie, dispatch `nexa:auth:logout`, and clear in-memory auth state. Other API clients (`stays-api`, `consent-api`, `messages-api`) still require `Authorization` on the failing request before refreshing.

**Fix:** Restore the `hadAuth` (or equivalent) guard to match the other clients.

---

### [P1] `getAuthHeaders()` is a no-op — `lib/stays-api.ts:111-114`

After removing `localStorage` JWT reads, `getAuthHeaders()` always returns `{}`. Every authenticated call depends on callers passing `token` from `useAuth()`:

```typescript
const headers = token ? { Authorization: `Bearer ${token}` } : getAuthHeaders();
```

Known call sites pass `token` today, but the fallback silently sends unauthenticated requests. Any new or missed caller will get 401s with no refresh retry (the interceptor also requires `hadAuth`).

**Fix:** Either remove the dead fallback and require `token` in the type signature for protected endpoints, or inject the in-memory JWT from a shared auth module so the fallback is real again.

---

### [P1] CSP `img-src` does not include production CDN hosts — `next.config.js:41-42`

`approvedListingImageHosts` (`media.nexastays.ma`, `cdn.nexastays.ma`, `storage.nexastays.ma`) were added to `images.remotePatterns`, but CSP `img-src` still only allows `'self'`, blob/data, map tiles, Unsplash, and `staysOrigin`.

`next/image` requests are same-origin (`/_next/image`), so optimized listing photos are fine. Any direct `<img src="https://cdn.nexastays.ma/…">` or third-party embed will be blocked by CSP in production. Review photos and wizard previews currently use blob URLs; future CDN-direct usage will fail silently.

**Fix:** Append the approved CDN origins to the CSP `img-src` directive (mirror `remotePatterns`).

---

### [P2] Auth hydration blocks `ready` until network round-trip — `contexts/AuthContext.tsx:101-118`

Previously, a JWT in `localStorage` set `ready=true` immediately. Now `ready` stays `false` until `hydrateAuthSession()` completes via HttpOnly refresh cookie. `ProtectedRoute` shows a loader (correct), but chrome that reads `isAuthenticated` without `ready` can flash logged-out UI — e.g. `MobileBottomNav` profile tab links to `/login` during hydration (`components/nav/MobileBottomNav.tsx:113`).

**Fix:** Gate nav auth affordances on `ready` (same pattern as `ProtectedRoute`), or show a neutral skeleton until hydration finishes.

---

### [P2] OTP registration token moved to `sessionStorage` — `contexts/AuthContext.tsx:19`, `89-98`

`nexa_otp_session_token` moved from `localStorage` to `sessionStorage`. Closing the tab mid-registration loses the OTP session; previously it survived tab/browser restarts. This is safer for XSS, but it is a user-visible regression on long registration flows.

**Fix:** Document the behavior in the registration UX (resume prompt), or accept the trade-off explicitly in release notes.

---

### [P2] ESLint no longer enforces React/Next rules — `eslint.config.mjs:32-41`

`eslint-config-next` was removed. `react-hooks/exhaustive-deps` and `@next/next/no-img-element` are stubbed as no-op rules to preserve legacy `eslint-disable` comments. `npm run lint` passes but will not catch hook dependency bugs or raw `<img>` usage regressions.

**Fix:** Re-enable `eslint-config-next` (or equivalent flat config) once compatible with ESLint 10 / Next 16, or add targeted rules back incrementally.

---

### [P2] Major framework jump without dedicated regression coverage — `package.json:42-44`

Next.js `14.2.35 → 16.2.12` and React `18 → 19` touch async `params`/`headers` (`app/[locale]/layout.tsx`, `app/layout.tsx`), client boundaries, and webpack-only build (`next build --webpack`). Build and audit tests pass, but there are no integration/e2e tests for booking, host wizard submit, or PWA offline.

**Fix:** Run manual smoke on login refresh, booking checkout, host listing publish, and SW registration before deploy; consider Playwright coverage for auth + listings search.

---

### [P2] Stale explore feed type — `components/explore/feed/types.ts:61-64`

`StickySearchRailData` still declares `onOpenSheet`, while `ExploreStickySearch` and `ExploreFeed` now use `onSearch`. The rail descriptor type is unused at runtime but will mislead future feed work.

**Fix:** Rename the field to `onSearch` (or remove the unused type).

---

### [P3] Dead Workbox configuration block — `next.config.js:179-248`

`@ducanh2912/next-pwa` was removed; `withPWA` is an identity function and the Workbox options live in a `void ({…})` expression. Safe but confusing for the next maintainer.

**Fix:** Delete the dead block or move runtime caching policy into comments on `public/nexa-sw.js`.

---

### [P3] Host wizard guest labels hard-coded in English — `components/host/listing-wizard/WizardStepBody.tsx:43-48`

`MAX_GUEST_OPTIONS` uses `"guest" / "guests"` literals instead of i18n keys, unlike the rest of the wizard.

**Fix:** Route through `t()` / `tf()` when touching this file next.

---

## Positive observations

- **Session security:** Moving refresh tokens to HttpOnly cookies and keeping access tokens in memory is the right direction. Logout now calls `logoutBrowserSession()` and clears sensitive SW caches.
- **API refresh consistency:** Sequential header fetch on 401 (`lib/header-api.ts`) avoids parallel refresh storms.
- **Service worker scope:** `public/nexa-sw.js` explicitly skips `/api/` and only caches `offline.html` for navigations — aligned with security audit tests.
- **Image host tightening:** Replacing `hostname: "**"` in `remotePatterns` with an allowlist reduces open-redirect / SSRF surface for the image optimizer.
- **Host wizard guards:** Morocco → `MA` normalization, guest/room caps, and omitting unset `base_price` on draft autosave are well covered by new unit tests (`lib/__tests__/host-listing-map-to-api.test.ts`).
- **Listings search UX:** `ExploreStickySearch` draft-local state prevents premature URL mutation; journey audit tests encode the intended mobile flow.
- **CI:** New `production-security.yml` adds audit, lint, test, build, gitleaks, and CodeQL on PRs.

---

## Test gaps

| Area | Current coverage | Gap |
|------|------------------|-----|
| Cookie auth hydration | Audit tests read source patterns | No test that simulates refresh cookie → JWT in memory |
| Service worker registration | Asserts `nexa-sw.js` source | No test that middleware excludes `nexa-sw.js` |
| CSP vs CDN images | Sumsub permissions tested | No assertion that CDN hosts appear in CSP `img-src` |
| KYC 401 interceptor | None | Missing test that anonymous 401 does not call refresh |
| Next 16 async APIs | Build only | No runtime test for locale layout `params` Promise |
| E2E user journeys | Node audit tests (static) | No browser tests for booking, registration tab-close, or offline |

---

## Residual risks

1. **Cross-origin cookies:** `withCredentials: true` on Identity/Stays clients requires correct `SameSite`, CORS, and aligned site/API domains in production. Failures manifest as silent logout after deploy.
2. **Cleaning fee removal:** Wizard UI and `map-to-api` no longer send `cleaning_fee`. Confirm the Stays API treats absence as zero and that pricing copy (“all-inclusive”) matches backend fee logic.
3. **PWA capability reduction:** Removing Workbox page/font/image caching improves security but reduces offline resilience compared to the previous PWA setup.
4. **Existing users with `localStorage` JWT:** One-time migration depends entirely on HttpOnly refresh cookies already being set. Users with only legacy `localStorage` tokens will appear logged out until they sign in again (expected, but worth comms).

---

## Recommendation

**Do not merge until P0 and P1 items are resolved.** The service worker and KYC interceptor issues are release blockers. P2 items should be addressed or explicitly accepted before the Next 16 production cut. Re-run `npm test`, `npm run lint`, `npm run build`, and manual SW + auth smoke after fixes.
