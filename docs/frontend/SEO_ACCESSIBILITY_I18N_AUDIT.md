# Phase G — SEO, Accessibility & Internationalization Audit

Date: 2026-07-26  
Application: `nexastays_web`  
Target: production readiness

## Executive summary

Phase G corrected the highest-impact indexability, metadata, structured-data,
contrast, heading, and locale-formatting defects found in the public web
application. Public static routes now publish localized metadata, canonical
URLs, Open Graph/Twitter data, and language alternates. Private routes now have
defence-in-depth `noindex` controls in page metadata, middleware response
headers, and `robots.txt`.

English, French, and Arabic translation bundles have identical key coverage
(1,831 keys each). Existing RTL direction, global keyboard focus, skip
navigation, and reduced-motion foundations were verified.

The application is substantially closer to launch readiness, but the audit
does **not** certify full WCAG 2.2 AA or Lighthouse ≥95 yet. The remaining
manual/browser validations and content-localization work are listed under
“Open production actions.”

## Implemented findings

| Severity | Category | Pages / component | Finding and root cause | Resolution | Verification |
| --- | --- | --- | --- | --- | --- |
| Critical | Indexability | Inbox, bookings, profile, auth, saved stays, host management | Private routes relied primarily on client authentication and incomplete crawler exclusions. | Added route metadata with `noindex`, `nofollow`, `nocache`, and `noimageindex`; middleware now adds `X-Robots-Tag`; robots rules exclude all private families. | Automated regression test plus source audit. |
| High | Metadata | Home, search, host, about, contact, fees, safety, terms, privacy, refund | Client pages inherited one generic root title/description and lacked route canonicals. | Added unique EN/FR/AR metadata, canonical URLs, hreflang, Open Graph, and Twitter metadata through route layouts. | Metadata regression tests and production compilation. |
| High | Robots | Global | Inbox, authentication, registration, saved content, host listing management, and API routes were omitted. | Rebuilt locale-aware private exclusions and excluded `/api/` and `/_next/`. Public routes remain allowed. | Automated route-family test. |
| High | Sitemap | Public static and SEO routes | Sitemap entries did not expose language alternates and could contain duplicate URLs. | Added EN/FR/AR alternates to static and dynamic entries and deterministic URL deduplication. | Automated sitemap policy test. |
| High | Structured data | City, neighborhood, amenity, and destination landing pages | An aggregate search page was presented as a single `LodgingBusiness`, and a detached `AggregateOffer` could misrepresent the entity. | Replaced both with a truthful `CollectionPage` whose main entity is an `ItemList`. | JSON-LD regression test. |
| High | Contrast | Global Nexa design tokens | Rose `#E8507A` on white was approximately 3.58:1 and metadata gray `#9E8A93` was approximately 3.23:1, below WCAG AA for normal text. | Moved action rose to `#C42A58` (about 5.50:1) and secondary metadata to `#79636E` (about 5.49:1). | Computed contrast regression test and RC Lighthouse review. |
| High | Heading hierarchy | Listings/search | The public search route had no H1 and began its filter hierarchy at H3. | Added a localized screen-reader H1 and promoted the filter heading to H2. | Automated source regression test. |
| Medium | Localization | Notification cards | Relative times were assembled with hard-coded English phrases and browser-default dates. | Replaced them with locale-aware `Intl.RelativeTimeFormat` and explicit localized dates. | Type checking and source review. |
| Medium | Localization | Listing reviews | Review dates used the browser default locale instead of the selected app locale. | Passed the selected locale into date formatting. | Type checking and component review. |
| Medium | Accessibility | Global skip navigation | The skip target was not programmatically focusable. | Added `tabIndex={-1}` to the stable target while preserving existing page landmarks. | Automated accessibility-foundation test. |
| Medium | Entity consistency | Root structured data | Root schema used `TravelAgency` while page schemas identified Nexa Stays as `Organization`. | Standardized the root entity to `Organization`. | JSON-LD/source review. |
| Medium | Locale signaling | Localized routes | Private and public localized responses lacked an explicit HTTP language signal. | Middleware now returns `Content-Language` and passes the locale to the request pipeline. | Middleware regression test. |

## Verified controls

- Dynamic destination, guide, and listing routes already generate localized
  metadata and canonical/hreflang URLs.
- Listing pages hide unavailable entities from indexing.
- Guide HTML is server-sanitized before rendering.
- JSON-LD is serialized with the safe JSON-LD serializer.
- Guide pages expose `Article`, breadcrumbs, and question/answer content.
- Destination pages expose breadcrumbs, place/destination entities, FAQ data,
  and truthful collection semantics.
- Listing pages expose lodging, address, geo, rating, offer, and breadcrumb data
  only when corresponding API data exists.
- `robots.txt`, `sitemap.xml`, web manifest, favicon assets, theme color, and
  viewport metadata exist.
- Translation key parity is exact across EN/FR/AR: 1,831 keys per locale.
- Arabic applies RTL direction and an Arabic font; the language provider updates
  document language and direction on locale changes.
- Global `:focus-visible`, reduced-motion overrides, and forced-colors messaging
  rules exist.
- Representative native image elements include alternative text; decorative
  previews use empty alt text.
- Search filters, messaging tabs, dialogs, drawers, and menus retain their
  existing keyboard and focus-management implementations.

## Indexability policy

### Index

- Localized home pages
- Listings search landing pages
- Stays and destination pages
- City, neighborhood, landmark, amenity, and property-type landing pages
- Guides
- Individual public listings that exist
- Public host acquisition page
- About, contact, fees, safety, terms, privacy, and refund pages

### Do not index

- Login and registration
- Inbox and conversation threads
- Booking and review-management routes
- My bookings
- Profile
- Saved listings
- Host dashboard
- Host listing creation and editing
- API routes

Private pages use both metadata and HTTP `X-Robots-Tag`; `robots.txt` is an
additional crawl-budget control rather than the only privacy boundary.

## Internationalization and RTL

Automated parity confirms that no locale bundle is missing a key. This does not
prove that every source string is translated. The audit found older public and
transactional components that still contain literal English presentation copy,
especially:

- `components/listing/ListingDetailPage.client.tsx`
- `components/reviews/RateStayContent.tsx`
- parts of host onboarding and host verification

These require a coordinated copy extraction and translation review. Replacing
them piecemeal without approved French and Arabic copy risks inaccurate legal,
safety, cancellation, and verification language.

The server root document currently starts with `lang="en"` and is corrected by
the locale provider during hydration; localized responses now also include
`Content-Language`. A fully correct pre-hydration `<html lang>` for every
locale requires moving the document root into the `[locale]` layout or a
coordinated server-locale layout migration. That change can affect static
generation and was not safely included in this bounded audit.

## Open production actions

### High — localized literal copy

Complete a copy-approved extraction of remaining hard-coded English strings in
listing details, reviews, and host onboarding. Verify French terminology and
Arabic wording with a native reviewer, including legal and safety content.

### High — server-rendered document language

Move locale ownership to a locale-aware root layout so the initial HTML source,
not only the hydrated document and HTTP header, carries the correct `lang` and
`dir`.

### High — browser accessibility certification

Run axe and manual screen-reader/keyboard testing against the deployed
production candidate:

- NVDA + Chrome on Windows
- VoiceOver + Safari on iOS/macOS
- TalkBack + Chrome on Android
- keyboard-only dialogs, menus, maps, booking, authentication, and messaging
- 200% and 400% zoom/reflow
- high contrast and reduced motion

Static source inspection cannot certify focus order, announcements, map
fallbacks, or runtime contrast over user-provided imagery.

### High — Lighthouse production measurements

Run Lighthouse mobile and desktop against representative deployed routes with
production APIs and media available:

- `/en`
- `/fr/listings`
- `/ar/stays/agadir`
- a live listing
- a live guide
- `/en/login`

The local Stays API at `127.0.0.1:3002` was unavailable during this audit.
Running Lighthouse against error/fallback content would produce misleading
scores, so no ≥95 claim is made.

### Medium — content and internal-link editorial review

Perform a crawler-backed link check after production content import. Dynamic
guide, destination, and listing records come from the SEO API, so orphan and
broken-link status depends on the production dataset rather than source code
alone.

### Medium — social preview assets

Create dedicated 1200×630 localized Open Graph images. The current fallback is
the Nexa Stays logo, which is valid but less effective as a large social card.

## Regression tests

`lib/__tests__/seo-accessibility-i18n-audit.test.ts` covers:

1. localized titles, canonical URLs, and hreflang;
2. private-route metadata;
3. robots and middleware private-route coverage;
4. sitemap alternates and URL deduplication;
5. truthful collection structured data;
6. EN/FR/AR key parity;
7. skip navigation, focus, reduced motion, and listings H1;
8. core WCAG contrast ratios;
9. representative native-image alt attributes.

## Release decision

The technical SEO and crawler-privacy defects fixed in this phase should be
included in the production candidate. Final launch certification remains
conditional on the four High actions above: approved literal-copy
localization, server-rendered language attributes, browser accessibility
testing, and real production Lighthouse measurements.
