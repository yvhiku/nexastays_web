# Phase S1 — Production SEO and GEO Certification

Certification date: 2026-07-26  
Application: `nexastays_web`  
Production domain: `https://www.nexastays.ma`  
Release-candidate test origin: `http://127.0.0.1:3015`  
Decision: **NO-GO — production SEO is not certified**

## Executive summary

Phase S1 tested the existing SEO/GEO architecture without adding page types or
content models.

The release-candidate implementation has a strong technical foundation:

- 255 unique sitemap URLs returned 200 in the production-equivalent crawl.
- Every sitemap URL had one self-referencing canonical.
- Every sitemap URL had complete EN/FR/AR/x-default alternates.
- 1,200 JSON-LD scripts parsed without syntax errors.
- No sitemap URL was `noindex`.
- No broken target was found across 952 unique internal links.
- 522 GEO question/answer blocks contained non-empty visible content.
- 246 AI snippets had a source and confidence value; all were marketplace
  sourced at confidence `1`.
- Private route families returned metadata and HTTP `noindex` protection.
- The optimized Next.js production build completed successfully.

The deployed production site does not currently expose that release-candidate
state correctly:

1. `https://www.nexastays.ma/sitemap.xml` returns 404.
2. `https://www.nexastays.ma/robots.txt` advertises
   `http://localhost:3005/sitemap.xml`.
3. The production home canonical points to `http://localhost:3005/en`.
4. Representative production destination and guide pages use the generic home
   title and emit no canonical.

Two high-severity data/content defects also remain in the current local stack:

1. Dynamic French and Arabic SEO payloads contain the same English titles,
   descriptions, GEO answers, and AI snippets as English.
2. The dynamic sitemap registry contains no public listing URLs even though
   indexable listing pages exist.

The application must not be submitted as fully certified to Google Search
Console or Bing Webmaster Tools until these issues are corrected, deployed,
and revalidated on the public domain.

## Test environments

### Public production

Direct HTTP validation was performed against:

- `https://www.nexastays.ma/en`
- `https://www.nexastays.ma/en/stays/agadir`
- `https://www.nexastays.ma/fr/stays/agadir`
- `https://www.nexastays.ma/ar/stays/agadir`
- `https://www.nexastays.ma/en/guides/agadir-best-time-to-visit`
- `https://www.nexastays.ma/robots.txt`
- `https://www.nexastays.ma/sitemap.xml`

### Production-equivalent release candidate

The current repository was built with `next build` and served with
`next start`. Local HTTPS enforcement was disabled only for loopback
measurement. The Stays API and its SEO registry were healthy on port 3002.

The configured local public URL was `http://localhost:3005`; therefore local
canonical comparisons normalized that configured origin while preserving and
comparing each path.

## Certification scorecard

| Area | Status | Evidence | Required action |
| --- | --- | --- | --- |
| Metadata | **Fail** | Release-candidate representative families have unique metadata, but deployed destination and guide pages return the generic home title. Dynamic FR/AR metadata is English. | Deploy the current release and localize backend SEO records. |
| Canonicals | **Critical fail** | Release candidate: 255/255 pages have exactly one matching canonical. Production home canonical points to localhost; sampled dynamic pages have none. | Set the public site URL at build time, deploy, and crawl again. |
| hreflang | **Warning** | Release candidate: 255/255 pages expose EN, FR, AR, and x-default with correct paths. The alternate pages currently repeat English dynamic content. | Localize dynamic records, then verify reciprocity in production. |
| Structured data | **Pass with external validation pending** | 1,200 JSON-LD blocks across 255 sitemap pages parsed successfully. Representative entities match page families. | Re-run Google Rich Results Test and Schema.org validator after deployment. |
| Sitemap | **Critical fail** | Release candidate: 255 unique URLs, all 200, no duplicates/noindex/canonical mismatches. Production sitemap is 404. Listing URLs are absent from the registry. | Deploy sitemap routing fix and add eligible listings to the backend registry. |
| robots.txt | **Critical fail** | Private route exclusions are present, but production advertises a localhost sitemap URL. | Correct production public URL and deploy. |
| Indexability | **Fail** | Release-candidate private routes have metadata and `X-Robots-Tag` protection. Public production discovery is broken by sitemap/canonical defects. | Deploy and inspect public/private samples with search-engine tools. |
| Open Graph | **Warning** | Titles/descriptions/URLs exist locally. Destination, guide, and listing images exist. Homepage image and `og:locale` were missing before the S1 fix. | Deploy S1 metadata fix and test public share debuggers. |
| Twitter cards | **Warning** | `summary_large_image` exists. Homepage image fallback was missing before the S1 fix. | Deploy and validate the public cards. |
| GEO blocks | **Fail localization** | 522 valid blocks, 174 per locale. FR/AR samples are identical English. | Supply approved localized backend content. |
| AI snippets | **Warning** | 246 valid snippets, all `marketplace`, confidence `1`, with no low-confidence drafts. Snippets are not directly rendered as a separate UI surface. FR/AR content is English. | Localize source payloads; keep snippets factual and provenance-aware. |
| Marketplace intelligence | **Pass data integrity / fail localization** | 213 registry pages have intelligence data; no negative/invalid audited values. Missing values are omitted by UI logic. | Localize labels/content and document metric methodology. |
| Internal links | **Warning** | 952 unique internal targets, zero broken targets, one intentional `/` locale redirect. Fifteen sitemap pages are orphaned. | Add natural links to national property/amenity pages. |
| Crawlability | **Fail production** | Local sitemap crawl is healthy; production sitemap and canonicals are not. | Redeploy and run a public-domain crawler. |
| Core Web Vitals | **Fail baseline targets** | Lab mobile LCP/CLS fail on representative routes; field INP is unavailable without RUM/CrUX. | Resolve verified performance issues and establish field monitoring. |
| Search Console | **Blocked** | No account/property access was available; public sitemap is currently broken. | Verify domain ownership, deploy fixes, submit sitemap, and inspect URLs. |
| Bing Webmaster | **Blocked** | No account access was available. | Verify site and submit the corrected sitemap after deployment. |

## Verified production defects

### S1-001 — Production sitemap is unavailable

- Severity: **Critical**
- Status: release-candidate fix implemented; production deployment pending
- Production evidence:
  - `GET https://www.nexastays.ma/sitemap.xml` → 404
  - `robots.txt` references `http://localhost:3005/sitemap.xml`
- Root cause:
  - Locale middleware intercepted `/sitemap.xml` and redirected it to a
    localized route.
  - The deployed public-site environment is also configured with the localhost
    origin.
- Smallest safe code fix:
  - Exclude `sitemap.xml` from the locale middleware matcher.
  - Add a regression assertion to prevent reintroduction.
- Verification:
  - Release candidate now returns 200 for `/sitemap.xml`.
  - The generated XML contains 255 unique URLs and localized alternates.
- Remaining action:
  - Configure `NEXT_PUBLIC_SITE_URL=https://www.nexastays.ma` in the production
    build environment and redeploy.

### S1-002 — Production canonicals use localhost or are missing

- Severity: **Critical**
- Status: deployment/configuration blocker
- Evidence:
  - Production `/en` canonical:
    `http://localhost:3005/en`
  - Sampled production destination and guide pages had no canonical.
- Root cause:
  - The deployed application was built without the correct public site URL
    and does not appear to contain the current dynamic SEO release.
- Required fix:
  - Set the public site URL before `next build`.
  - Run `npm run release:env`.
  - Deploy the current release-candidate artifact.
- Reverification:
  - Crawl production and require exactly one HTTPS self-canonical per public
    URL.
  - Reject any `localhost`, `127.0.0.1`, non-HTTPS, missing, or cross-locale
    canonical.

### S1-003 — Dynamic localized SEO content is English in every locale

- Severity: **High**
- Status: unresolved
- Evidence:
  - EN, FR, and AR Agadir API responses return the same English title.
  - Their first GEO question/answer and AI snippet are also identical English.
  - Sitemap-wide duplicate groups align with locale triplets.
- Root cause:
  - The backend SEO content records/fallbacks do not provide approved French
    and Arabic variants.
- Required fix:
  - Populate reviewed localized SEO records in the backend/content source.
  - Do not machine-translate legal, safety, or factual travel guidance without
    editorial review.
- Reverification:
  - Compare titles, descriptions, headings, GEO blocks, FAQs, guide bodies, and
    snippets across locale triplets.
  - Confirm correct Arabic direction and language at first HTML paint.

### S1-004 — Public listings are absent from the sitemap

- Severity: **High**
- Status: unresolved
- Evidence:
  - Dynamic SEO registry entries: 219.
  - Listing entries in the registry: 0.
  - A representative live listing returns an indexable page with
    `LodgingBusiness`, rating, offer, address, and geo data.
- Root cause:
  - Eligible listings are not being emitted by the backend sitemap registry.
- Required fix:
  - Add only public, available, indexable listings to the registry.
  - Supply correct `lastmod` and EN/FR/AR alternates.
- Reverification:
  - Confirm every sitemap listing is 200, canonical, indexable, and available.
  - Confirm unavailable/private listings are absent.

### S1-005 — Social metadata was incomplete

- Severity: **High**
- Status: fixed in release candidate; deployment pending
- Evidence:
  - Homepage generated no `og:image`, `twitter:image`, or `og:locale`.
  - Other sampled pages had an image but no `og:locale`.
- Root cause:
  - Route metadata replaced the root Open Graph object while passing
    `images: undefined`.
  - The shared metadata helper did not define Open Graph locale values.
- Smallest safe fix:
  - Use the Nexa Stays brand image as a fallback.
  - Emit `en_US`, `fr_FR`, or `ar_MA` plus alternate locales.
- Remaining action:
  - Deploy and validate Facebook, LinkedIn, X, WhatsApp, and Discord previews.
  - Dedicated 1200×630 localized images remain a content improvement, not an
    S1 certification prerequisite.

### S1-006 — National filter pages are orphaned

- Severity: **Medium**
- Status: unresolved
- Evidence:
  - Fifteen national pages in the sitemap had zero incoming links from another
    sitemap page:
    - `/[locale]/stays/apartments`
    - `/[locale]/stays/family`
    - `/[locale]/stays/free-parking`
    - `/[locale]/stays/hostels`
    - `/[locale]/stays/wifi`
- Root cause:
  - They are generated and registered but not included in the audited
    destination/guide navigation graph.
- Required fix:
  - Add useful, visible links from appropriate stays discovery pages.
  - Do not create bulk footer links solely for crawlers.

## Sitemap and crawl metrics

| Metric | Result |
| --- | ---: |
| Release-candidate sitemap URLs | 255 |
| Unique sitemap URLs | 255 |
| Duplicate sitemap URLs | 0 |
| Sitemap URLs returning 200 | 255 |
| Missing titles | 0 |
| Missing descriptions | 0 |
| Canonical count failures | 0 |
| Canonical path mismatches | 0 |
| `noindex` URLs in sitemap | 0 |
| Pages with complete alternate sets | 255 |
| JSON-LD scripts parsed | 1,200 |
| JSON-LD syntax failures | 0 |
| Unique internal targets checked | 952 |
| Broken internal targets | 0 |
| Internal redirect targets | 1 (`/` → locale) |
| Orphan sitemap pages | 15 |
| Average unique outgoing links per page | 34 |
| Maximum unique outgoing links on a page | 48 |
| Dynamic backend sitemap records | 219 |
| Unique dynamic paths across locales | 73 |
| Dynamic listing records | 0 |

The page-count figures are crawlable URLs, not Google/Bing indexed-page counts.
Actual indexed counts require webmaster-tool access.

## Metadata family sampling

The release candidate was checked for:

- Home
- Destination
- Neighborhood
- National property type
- National amenity
- City/filter combination
- Landmark
- Guide
- Live listing
- Static about page

All ten samples returned:

- HTTP 200
- A non-empty title
- A non-empty description
- Exactly one self-canonical
- Index/follow or the backend’s intentional noindex/follow directive
- Open Graph title and description
- Twitter card metadata

Neighborhood, amenity, and landmark samples were intentionally `noindex`
because their backend SEO registry did not mark the records indexable. They
were not present in the generated sitemap.

## hreflang results

Across all 255 release-candidate sitemap pages:

- EN was present.
- FR was present.
- AR was present.
- x-default was present and targeted EN.
- Alternate paths matched the canonical path in the target locale.
- No malformed or missing alternate set was found.

Technical reciprocity passes. Content-language equivalence fails because
dynamic FR and AR payloads are English.

## Structured-data results

The crawler parsed 1,200 JSON-LD scripts without a syntax failure.
Representative output contained the expected types:

- Root/static: `Organization`
- Destination/filter: `CollectionPage`, `ItemList`, `BreadcrumbList`,
  destination/place entities, FAQ questions and answers
- Guide: `Article`, `BreadcrumbList`, destination context, FAQ where present
- Listing: `LodgingBusiness`, `PostalAddress`, `GeoCoordinates`,
  `AggregateRating`, `Offer`, and `BreadcrumbList` when source data exists

Aggregate pages use `CollectionPage`/`ItemList`, not a fabricated
`LodgingBusiness`.

External Google Rich Results Test and Schema Markup Validator checks remain
required against the redeployed public URLs. Local syntax/entity inspection
does not substitute for those services.

## GEO and marketplace-data results

| Metric | Result |
| --- | ---: |
| Registry payloads fetched | 219 / 219 |
| GEO blocks | 522 |
| GEO blocks with missing question/answer | 0 |
| GEO blocks per locale | 174 |
| AI snippets | 246 |
| Marketplace-sourced snippets | 246 |
| AI draft snippets | 0 |
| Minimum/average/maximum confidence | 1 / 1 / 1 |
| Invalid snippet records | 0 |
| Pages with marketplace intelligence | 213 |
| Invalid negative audited metrics | 0 |

GEO questions and answers are visible in the page UI and are also represented
as question/answer structured data where appropriate. The data-integrity shape
passes, but localization does not.

`aiSnippets` currently provide a backend data foundation and are not rendered
as an independent hidden or user-visible snippet surface. Their marketplace
facts overlap with visible marketplace intelligence. Certification should not
claim that every snippet is independently visible until a deliberate,
user-facing presentation and equivalence test exists.

## Private-route controls

The following release-candidate families were sampled:

- Login
- Registration
- Inbox
- Bookings
- My bookings
- Profile
- Saved listings
- Host dashboard
- Host listings

Every response carried:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

Rendered private pages also emitted `noindex` metadata. None appeared in the
release-candidate sitemap.

## Lighthouse and lab Core Web Vitals

Measurements used an optimized production build. Scores are single-run lab
results, not field Core Web Vitals.

| Route / mode | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | TTFB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home desktop | 93 | 98 | 100 | 100 | 0.46s | 1.73s | 0ms | 0.006 | 42ms |
| Destination desktop | 99 | 100 | 100 | 100 | 0.47s | 1.01s | 0ms | 0.000 | 10ms |
| Guide desktop | 98 | 100 | 100 | 100 | 0.48s | 1.14s | 0ms | 0.001 | 12ms |
| Listing desktop | 78 | 91 | 96 | 100 | 0.49s | 4.42s | 0ms | 0.000 | 21ms |
| Home mobile | 69 | 98 | 100 | 100 | 2.19s | 6.77s | 0ms | 0.139 | 29ms |
| Destination mobile | 65 | 100 | 100 | 100 | 2.04s | 5.26s | 0ms | 0.272 | 9ms |
| Guide mobile | 64 | 100 | 100 | 100 | 2.04s | 5.65s | 0ms | 0.272 | 9ms |
| Listing mobile | 68 | 91 | 96 | 100 | 2.19s | 19.09s | 48ms | 0.136 | 47ms |

Targets passed:

- All SEO scores
- All destination/guide accessibility and best-practices scores
- Desktop performance for home, destination, and guide

Targets failed:

- Listing desktop performance, accessibility, and best practices
- All four mobile performance scores
- Listing mobile accessibility and best practices

Verified listing accessibility/best-practice findings:

- Prohibited ARIA attributes
- Non-sequential heading order
- Link without a discernible name
- Visible label/accessibility-name mismatch
- Incorrect displayed image aspect ratio

The lab run also reported an apparent same-URL redirect delay on the loopback
origin. This may be influenced by local PWA/service-worker behavior and the
configured canonical origin, so it must be remeasured on a clean public
production deployment before attributing the delay to application navigation.

Lighthouse produced complete JSON reports but logged a Windows temporary
Chrome-profile cleanup `EPERM` after each run. The cleanup warning did not
invalidate the reports or category/audit data.

INP cannot be certified from this one-run lab suite. Production RUM or CrUX
data is required.

## Search Console readiness

Status: **Blocked**

Before submission:

1. Configure the production public URL.
2. Deploy the current release candidate.
3. Confirm `https://www.nexastays.ma/sitemap.xml` returns 200.
4. Confirm robots advertises that exact HTTPS sitemap.
5. Correct localized dynamic content.
6. Add eligible listing pages to the sitemap registry.
7. Verify domain ownership.
8. Submit the sitemap.
9. Inspect representative home, destination, guide, and listing URLs.
10. Review indexing, enhancements, mobile usability, and Core Web Vitals.

No claim is made about indexed-page count or Search Console coverage because
the account was not accessible during this audit.

## Bing Webmaster readiness

Status: **Blocked**

After production revalidation:

1. Verify the domain.
2. Submit the HTTPS sitemap.
3. Run URL inspection on representative page families.
4. Review crawl diagnostics and indexing status.

## Changes made during S1

S1 applied only two verified, narrow fixes:

1. Excluded `/sitemap.xml` from locale middleware redirection.
2. Completed shared social metadata with:
   - a fallback Nexa Stays image;
   - `og:locale`;
   - alternate Open Graph locales;
   - a Twitter image fallback.

Regression tests were added for both behaviors. No page type, content model,
schema, API, or SEO architecture was introduced.

## Launch recommendation

**NO-GO for SEO/GEO certification.**

The release candidate is technically coherent, but the public deployment and
backend localized content do not yet satisfy Phase S1:

- production sitemap and canonical configuration are critical blockers;
- dynamic localization and listing sitemap coverage are high blockers;
- mobile performance and listing accessibility require remediation;
- Search Console, Bing, public social previews, field Core Web Vitals, and
  external schema validators remain unverified.

## Re-certification checklist

- [ ] `NEXT_PUBLIC_SITE_URL` is the production HTTPS origin during build.
- [ ] `npm run release:env` passes in the deployment environment.
- [ ] Current release candidate is deployed.
- [ ] Production sitemap returns 200 and contains no bad URLs.
- [ ] Production robots references the HTTPS sitemap.
- [ ] Every public production page has one self-canonical.
- [ ] EN/FR/AR dynamic content is genuinely localized.
- [ ] Hreflang remains reciprocal after localization.
- [ ] Eligible public listings are present in the sitemap.
- [ ] Orphan national filter pages receive natural internal links.
- [ ] JSON-LD passes Google and Schema.org validators.
- [ ] Social previews pass platform debuggers.
- [ ] Listing accessibility defects are fixed.
- [ ] Mobile Lighthouse performance meets the S1 target.
- [ ] Production RUM/CrUX baseline is recorded.
- [ ] Search Console property and sitemap are verified.
- [ ] Bing Webmaster property and sitemap are verified.
- [ ] A final public-domain crawl has no unresolved critical defects.

