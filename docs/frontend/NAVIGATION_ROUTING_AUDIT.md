# Phase A — Navigation & Routing Production Audit

Audit date: 2026-07-26

Scope: `nexastays_web` App Router routes, shared navigation surfaces, locale routing, route guards, loading/error boundaries, and production HTTP behavior.

## Executive result

The route graph is coherent and the production build succeeds. Public pages, localized deep links, protected route shells, PWA assets, and representative statically generated SEO pages respond successfully in the production server.

Five navigation defects were fixed:

1. The registration logo bypassed the current locale.
2. The host listing-wizard logo bypassed the current locale.
3. Booking support links dropped the current locale.
4. Language switching dropped URL hash anchors and `localePath` could double-prefix an already localized path.
5. Localized routes had no branded localized 404 boundary, and the route error boundary exposed English-only recovery copy.

One high-severity production issue remains: invalid dynamic SEO parameters display the correct branded not-found state and emit `noindex`, but Next.js 14 returns HTTP 200 after the localized client-provider layout begins streaming. See “Open findings.”

## Route inventory

All application pages inherit the root layout and localized provider layout. Inbox routes additionally inherit the protected inbox layout.

| Route | Purpose | Authentication | Parameters | Status |
| --- | --- | --- | --- | --- |
| `/[locale]` | Locale homepage / entry experience | Public | `locale` | Reachable |
| `/[locale]/about` | About Nexa Stays | Public | `locale` | Reachable |
| `/[locale]/contact` | Contact and support | Public | `locale`, optional query | Reachable |
| `/[locale]/fees` | Fee transparency | Public | `locale` | Reachable |
| `/[locale]/terms` | Terms | Public | `locale` | Reachable |
| `/[locale]/privacy` | Privacy policy | Public | `locale` | Reachable |
| `/[locale]/refund` | Refund policy | Public | `locale` | Reachable |
| `/[locale]/safety-transparency` | Safety information | Public | `locale` | Reachable |
| `/[locale]/login` | Authentication | Public; redirects after login | `locale`, `redirect` query | Reachable |
| `/[locale]/registration` | Registration and verification | OTP/JWT-aware | `locale`, `redirect` query | Reachable; locale link fixed |
| `/[locale]/listings` | Search and discovery | Public | `locale`, search query | Reachable |
| `/[locale]/listings/[id]` | Listing detail | Public | `locale`, `id` | Reachable; invalid ID shows not-found |
| `/[locale]/stays` | SEO stays directory | Public | `locale` | Reachable |
| `/[locale]/stays/[segment]` | City/type/amenity landing page | Public | `locale`, `segment` | Reachable; SSG |
| `/[locale]/stays/[segment]/[combo]` | City/filter/neighborhood landing page | Public | `locale`, `segment`, `combo` | Reachable; SSG |
| `/[locale]/guides` | Travel guide directory | Public | `locale` | Reachable |
| `/[locale]/guides/[slug]` | Travel guide detail | Public | `locale`, `slug` | Reachable; SSG |
| `/[locale]/host` | Host onboarding/application | Public with authenticated progression | `locale` | Reachable |
| `/[locale]/host/dashboard` | Host operations | JWT protected; host state checked in page | `locale`, hash tabs | Guarded |
| `/[locale]/host/listings/new` | Create host listing | JWT protected | `locale`, optional `draft` | Guarded; locale logo fixed |
| `/[locale]/host/listings/[id]/edit` | Edit host listing | JWT protected; ownership API enforced | `locale`, `id` | Guarded |
| `/[locale]/saved-listings` | Saved stays | JWT protected | `locale` | Guarded |
| `/[locale]/profile` | Account profile | JWT protected | `locale` | Guarded |
| `/[locale]/my-bookings` | Guest trips | JWT protected | `locale` | Guarded |
| `/[locale]/bookings/[id]` | Booking detail | JWT protected; ownership API enforced | `locale`, `id` | Guarded; support link fixed |
| `/[locale]/bookings/[id]/review` | Stay review | JWT protected; eligibility API enforced | `locale`, `id` | Guarded |
| `/[locale]/inbox` | Conversation list | JWT protected by inbox layout | `locale` | Guarded |
| `/[locale]/inbox/[id]` | Conversation thread | JWT protected; membership API enforced | `locale`, `id` | Guarded |
| `/api/messaging/attachment-download` | Signed attachment proxy | API authorization | attachment query | Reachable |
| `/manifest.webmanifest` | PWA manifest | Public | — | 200 |
| `/robots.txt` | Crawler policy | Public | — | 200 |
| `/sitemap.xml` | SEO route inventory | Public | — | Generated |

No duplicate filesystem routes were found. The SEO directory routes are intentionally less prominent in primary navigation but are linked through destination/guide surfaces and sitemap output; they are not orphan pages.

## Findings and fixes

### High — Fixed: localized flows escaped to `/`

Root cause: registration and listing-wizard logo links used literal `href="/"`. Middleware recovered by redirecting, but the redirect used cookie/browser preference rather than necessarily preserving the active route locale.

Fix: both links now use `localePath("/")`.

### High — Fixed: booking support dropped locale

Root cause: the booking detail support link used `/contact?booking=...` directly.

Fix: the complete path and query now pass through `localePath`.

### High — Fixed: locale helper could duplicate prefixes

Root cause: `LanguageContext.localePath` always prepended the active locale, including paths that were already localized.

Fix: it delegates to the existing safe `resolveLocalizedPath` helper.

### Medium — Fixed: language switches dropped anchors

Root cause: language switching preserved `window.location.search` but omitted `window.location.hash`.

Fix: query and hash are now retained when switching English, French, and Arabic.

### Medium — Fixed: incomplete localized recovery routes

Root cause: localized routes relied on the generic not-found experience, while the route error boundary contained hard-coded English copy and only a retry action.

Fix: added a branded localized not-found boundary and localized error recovery with retry and locale-preserving home actions in English, French, and Arabic.

## Open findings

### High — Dynamic invalid parameters are streamed soft 404s

Affected routes:

- `/[locale]/listings/[id]`
- `/[locale]/guides/[slug]`
- `/[locale]/stays/[segment]`
- `/[locale]/stays/[segment]/[combo]`

Observed production behavior:

- Correct branded not-found content.
- `<meta name="robots" content="noindex">`.
- Next.js response status is HTTP 200 because the response begins streaming before `notFound()` resolves.

This should be resolved before launch for correct crawler and cache semantics. A safe fix requires choosing one of:

- a non-streaming server validation boundary above the localized client providers;
- a route/catalog matcher that can reject known SEO slugs before rendering;
- a framework upgrade where the chosen routing structure can emit the desired status reliably.

Middleware duplication of listing API requests was intentionally not introduced because it would add latency, duplicate backend traffic, and create a second source of route authorization truth.

### Medium — Browser interaction matrix needs an automated harness

There is no Playwright/Cypress/browser test dependency in the project. Static analysis and production HTTP smoke tests cannot prove focus restoration, console cleanliness after hydration, back gestures, or client-side auth redirects for real guest/host sessions.

Recommended release-gate follow-up: add a browser harness with seeded guest and host accounts and run the navigation matrix in Chromium/WebKit/mobile emulation.

### Low — Large route chunks merit later performance profiling

The production output reports approximately 282 kB first-load JavaScript for inbox threads and 307 kB for listing detail. The routes are code-split and build cleanly, but navigation timing should be measured in a browser before setting performance budgets.

## Validation evidence

- TypeScript: passed.
- Automated tests: 72 passed after the audit fixes.
- Production Next.js build: passed without build or type warnings.
- Production HTTP smoke tests:
  - `/` redirects to `/en` when no locale preference is supplied.
  - representative EN/FR/AR public pages return 200;
  - representative SSG city, combo, and guide pages return 200;
  - protected page shells return valid documents and are guarded client-side;
  - manifest and robots routes return 200.
- Static navigation scan found no literal `href="#"` placeholders.
- Post-login path validation rejects protocol-relative, external, backslash, and script-like targets.

## Regression coverage added

`lib/__tests__/navigation-routing.test.ts` now covers:

- localized dynamic query/hash paths;
- already localized paths without duplicate prefixes;
- unsafe post-auth redirect rejection;
- locale-safe navigation surfaces;
- preservation of query strings and hash anchors during language switching.

## Release assessment

Navigation is materially safer after this audit, but Phase A should not be marked fully production-ready until the dynamic-route HTTP status issue is resolved and the authenticated browser navigation matrix is exercised with real fixtures.
