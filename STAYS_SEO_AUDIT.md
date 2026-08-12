# Nexa Stays — Full SEO Audit

**Status:** AUDIT COMPLETE  
**Scope:** Technical SEO baseline for `nexastays_web` + stays SEO APIs + SEO DB migrations  
**Classification:** AUDIT ONLY — NO IMPLEMENTATION  
**Date:** 2026-08-12  
**Evidence environment:** Local web `http://localhost:3005`, stays API `http://localhost:3002`  

**Evidence labels used throughout:** VERIFIED | INFERRED | NOT MEASURED | PROPOSED  

---

## Production data boundary

| Class | Status in this audit |
| --- | --- |
| Technical indexability (robots, meta, canonical, sitemap, SSR HTML) | VERIFIED where probed/source-traced |
| Actual Google indexation | **NOT MEASURED** — no Search Console access |
| Search impressions / clicks | **NOT MEASURED** — no GSC |
| Core Web Vitals / CrUX | **NOT MEASURED** — no production Lighthouse/CrUX |

Localhost verifies rendering and technical implementation only. **Do not equate “technically indexable” with “SEO is working in Google.”**

---

## 1. Executive Summary

Nexa Stays has a **substantial Morocco programmatic SEO platform** (`/[locale]/stays/...`, guides, backend registry, JSON-LD, robots/sitemap generators). Local runtime confirms many city/combo/guide URLs return **200**, emit **canonical + robots**, and inject **JSON-LD**.

Critical gaps prevent competing cleanly for accommodation search:

1. **Sitemap emits zero property detail URLs** while explore discovery is largely CSR.  
2. **Localhost leakage** in Host/Sitemap/canonicals whenever `NEXT_PUBLIC_SITE_URL` falls back (dev VERIFIED; production misconfig is a known certification risk).  
3. **FR/AR SEO copy is English** for stays + guides titles/H1s despite hreflang URLs.  
4. **Explore `/listings` is CSR** with static layout metadata; query URLs canonicalize to base explore but stay `index,follow`.  
5. **Invalid listing IDs soft-404** (HTTP 200 + noindex + explore fallback metadata).

### Top 5 blockers

1. No listing detail URLs in sitemap (discovery depends on internal links / luck).  
2. Production site URL / localhost leakage risk for canonicals & robots Host.  
3. Locale content not localized (hreflang without unique FR/AR content).  
4. Explore CSR + parameterized URL crawl space.  
5. Soft 404 for missing listings.

### Top 5 opportunities

1. Include LIVE indexable listing URLs in sitemap (batched).  
2. Enforce production `NEXT_PUBLIC_SITE_URL` and certify robots/sitemap absolutes.  
3. Localize SEO payloads (or noindex non-translated locales until ready).  
4. Explicit noindex or stronger canonical policy for query/cursor URLs.  
5. Hard 404 for missing listings; keep indexable only for LIVE + quality gates.

### Finding counts (this audit)

| Severity | Count |
| --- | ---: |
| P0 | 1 |
| P1 | 7 |
| P2 | 8 |
| P3 | 4 |

### Verdict

**Technically ambitious SEO architecture with real destination/guide surfaces, but incomplete discovery for properties, weak international content, and environment/URL risks.** Ready for a phased implementation plan — not production-certified from this audit alone.

---

## 2. Repository and SEO Architecture Map

```text
Googlebot
  → /robots.txt (app/robots.ts)
  → /sitemap.xml (app/sitemap.ts + stays/seo/registry/sitemap)
  → /[locale]/* (middleware.ts locale prefix)
  → generateMetadata / buildSeoMetadata / buildPublicStaticMetadata
  → Route render (SSR shell + client islands)
  → stays SEO API / listing SEO API
  → HTML + application/ld+json
```

| Layer | File(s) | Actual responsibility | Evidence |
| --- | --- | --- | --- |
| Site URL | `lib/env.ts` `getPublicSiteUrl` | Canonical/sitemap/OG origin; defaults `http://localhost:3005` in non-production | VERIFIED source |
| Robots | `app/robots.ts` | Allow `/`; disallow private locale paths + `/api/` `/_next/` | VERIFIED runtime |
| Sitemap | `app/sitemap.ts` | Static public routes × 3 locales + registry entries | VERIFIED runtime count 258 |
| Metadata | `lib/seo/metadata.ts` | Title, description, canonical, hreflang, OG, Twitter, robots | VERIFIED source |
| Static public meta | `lib/seo/static-route-metadata.ts` | Home/listings/legal copy; private noindex helpers | VERIFIED source |
| Locale | `middleware.ts`, `lib/i18n` | Prefix en/fr/ar; `X-Robots-Tag` on private | VERIFIED source |
| Destinations | `app/[locale]/stays/**` | Programmatic landings; ISR 86400 | VERIFIED source + runtime |
| Guides | `app/[locale]/guides/**` | Guide articles; ISR 86400 | VERIFIED runtime |
| Listing detail | `app/[locale]/listings/[id]/page.tsx` | SEO payload + JSON-LD SSR; body CSR | VERIFIED source + runtime |
| Explore | `app/[locale]/listings/page.tsx` | Client-only explore UI | VERIFIED source |
| JSON-LD | `lib/seo/json-ld.ts` | Landing / guide / listing graphs | VERIFIED source |
| Backend SEO | `backend/stays/src/modules/seo/*` | Pages, registry, freshness, listing SEO | VERIFIED source |
| DB | migrations `028`–`032_seo_*.sql` | Destinations, combos, neighborhoods, guides, landing content | VERIFIED source |

---

## 3. Public URL Inventory

| URL pattern | Example | Rendering | Indexable? | Canonical | Locale-aware | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/en` | SSR marketing | Yes (meta index) | Absolute siteUrl | Yes | Yes |
| Explore | `/en/listings` | **CSR** results | Yes (layout meta) | Absolute `/en/listings` | Layout copy localized | Yes (hub only) |
| Explore + query | `/en/listings?city=…` | CSR | Meta index,follow | **Canonical → base `/en/listings`** | Same static meta | No query URLs |
| Listing detail | `/en/listings/{uuid}` | Hybrid (meta/JSON-LD SSR, body CSR) | LIVE+quality → index | Self absolute | Path locale; body often EN | **No** (0 URLs) |
| Invalid listing | `/en/listings/{bad-uuid}` | Soft 404 | **noindex** | Falls back to `/en/listings` | — | No |
| Stays hub | `/en/stays` | SSR + client | Yes | Absolute | Path | Yes |
| City | `/en/stays/casablanca` | SSR shell + client; ISR | Registry/freshness | Self | Path; **copy often EN** | Yes if indexable |
| Combo | `/en/stays/casablanca/apartments` | Same | Same | Self | Same | Yes if indexable |
| Guides hub | `/en/guides` | SSR | Yes | Absolute | Path | Yes |
| Guide article | `/en/guides/{slug}` | SSR shell + client | Yes (seeded) | Self | Path; **title EN across locales** | Yes |
| Static content | `/en/about` etc. | Static meta layouts | Yes | Absolute | Static COPY | Yes |
| Private guest/host | `/en/inbox` etc. | App | noindex + robots disallow (subset) | — | — | No |

Discover actual SEO landings under **`/stays`**, not `/destinations`.

---

## 4. Crawlability and Indexability

### robots.txt — VERIFIED runtime

```text
User-Agent: *
Allow: /
Disallow: /api/, /_next/, localized private segments
Host: http://localhost:3005
Sitemap: http://localhost:3005/sitemap.xml
```

Private disallow covers: bookings, my-bookings, profile, inbox, login, registration, saved-listings, host/dashboard, host/listings × en/fr/ar.

**Gaps (INFERRED):** host analytics/bookings/reviews/inbox layouts use metadata noindex but are **not** all mirrored in robots disallow.

### Meta robots — VERIFIED samples

| Family | Robots |
| --- | --- |
| Home / listings / stays / guides | `index, follow` |
| Query listings URLs | `index, follow` (canonicalized to base) |
| Invalid listing | `noindex` |
| Private layouts | noindex via `buildPrivateMetadata` (source) |

### HTTP behavior — VERIFIED samples

| URL | Status | Notes |
| --- | ---: | --- |
| Valid public pages probed | 200 | |
| Invalid listing UUID | **200** | Soft 404 — should be 404/410 (PROPOSED) |
| Trailing slash / www | NOT MEASURED in depth | |

---

## 5. Sitemap Audit

| Sitemap | URL count | URL source | LIVE-only? | Canonical URLs? | Locale URLs? | Last modified |
| --- | ---: | --- | --- | --- | --- | --- |
| `/sitemap.xml` | **258** | Static routes × 3 locales + `GET stays/seo/registry/sitemap` | Registry: `indexable=true` + `status=published` (not listing LIVE list) | Absolute via `getPublicSiteUrl()` | Yes (en/fr/ar paths + alternates) | Static entries use **`new Date()` every request**; registry uses DB lastmod |

**Critical checks:**

| Check | Result | Label |
| --- | --- | --- |
| LIVE listings in sitemap? | **0** listing detail URLs | VERIFIED |
| Drafts excluded from listing SEO API? | Non-LIVE → 404 on SEO listing endpoint | VERIFIED source |
| Localhost in all locs? | **258/258** on local | VERIFIED |
| Stays pages present? | 126 | VERIFIED |
| Guides present? | 96 | VERIFIED |
| lastmod meaningful? | Static = request-time (artificial churn) | VERIFIED |
| Scalability | Single `find()` of all indexable registry rows | VERIFIED source (memory risk INFERRED) |

---

## 6. Canonical URL Audit

`buildSeoMetadata` sets `alternates.canonical` to **path**; Next resolves against `metadataBase` / absolute OG uses `siteUrl + path`.

| Page family | Example | Current canonical | Correct locally? | Risk |
| --- | --- | --- | --- | --- |
| Home | `/en` | `http://localhost:3005/en` | Dev OK | Prod leakage if SITE_URL wrong — **P0/P1** |
| Explore | `/en/listings` | `http://localhost:3005/en/listings` | Yes | |
| Explore + filters | `?city=&sort=&cursor=` | **Always base `/en/listings`** | Good for dupes | Still indexable URLs if linked |
| City | `/en/stays/casablanca` | Self absolute localhost | Dev OK | |
| Combo | `/en/stays/casablanca/apartments` | Self | Dev OK | |
| Guide | `/en/guides/morocco-travel-guide` | Self (expected) | | |
| Listing LIVE | `/en/listings/{id}` | Self absolute | Dev OK | Missing from sitemap |
| Invalid listing | bad UUID | **`/en/listings`** + noindex | Soft 404 | Confusing signals |

Relative vs absolute: OG/Twitter/sitemap use absolute `getPublicSiteUrl()` — VERIFIED.

---

## 7. International SEO — EN / FR / AR

### hreflang

`buildSeoMetadata` builds `en` / `fr` / `ar` / `x-default` → EN path. VERIFIED source.

Runtime city page: reciprocal locale paths exist in API payload (`hreflang` object). HTML link tags depend on Next metadata rendering (probed pages indexable).

| Content type | EN | FR | AR | x-default | Reciprocal URLs | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| Stays city | EN title/H1 | **Same English title/H1** | **Same English** | → EN | Paths exist | **Broken i18n content** |
| Guide | EN title | **Same English title** | **Same English** | → EN | Paths exist | **Broken i18n content** |
| Explore layout | Localized static COPY | Localized | Localized | — | — | OK for chrome only |
| Listing detail | Host language | Same payload path | Same | → EN | | Content not truly localized |

**VERIFIED:** `/en|fr|ar/stays/casablanca` titles identical: `Stays in Casablanca | Hotels, Riads & Apartments | Nexa Stays`.  
**VERIFIED:** guide `morocco-travel-guide` title identical across en/fr/ar.

RTL `dir` does not change canonical generation (INFERRED from metadata builder).

---

## 8. Metadata Audit

| Route family | Title strategy | Unique? | Description strategy | Locale aware? | Defect |
| --- | --- | --- | --- | --- | --- |
| Home / static | Static COPY per locale | Per-route | Static | Yes (UI copy) | Fine |
| Explore | Static “Explore Verified Stays…” | **Not query-specific** | Static | UI copy yes | Filter intent invisible |
| City | Backend generated | Unique per city (EN) | Includes live price/count | **Payload EN** | FR/AR duplicate |
| Combo | Backend generated | Unique vs city (EN) | Unique vs city | **Payload EN** | FR/AR duplicate |
| Guide | Backend | Per slug EN | — | **EN across locales** | i18n |
| Listing | `{title} in {city}` | Per listing | From SEO service | Partial | Soft 404 fallback uses explore title |

---

## 9. Open Graph / Social Metadata

`buildSeoMetadata` sets `og:title`, `og:description`, `og:url` (absolute), `og:image` (absolute or logo fallback), Twitter summary_large_image. VERIFIED source.

Risks: localhost OG URLs in local (VERIFIED); listing images depend on `ogImageUrl` absolute-ness (INFERRED).

---

## 10. Rendering and Crawlability

| Page type | Rendering | Initial HTML contains SEO content? | SEO risk |
| --- | --- | --- | --- |
| Stays city/combo | SSR fetch + client UI; ISR 86400 | Title/meta/JSON-LD + landing links to listings (**12 listing links** VERIFIED on Casablanca) | Medium — body richness partly client |
| Guides | SSR + client | Meta + JSON-LD + sanitized HTML | Medium |
| Explore `/listings` | **CSR** | Shell + static meta; **no result cards in SSR** | **High** |
| Listing detail | Meta/JSON-LD SSR; **ListingDetailPageClient** fetches listing | JSON-LD LodgingBusiness present; body after CSR | **High** for content understanding |
| Home | SSR | Marketing content | Lower |

---

## 11. Listing Detail SEO

| Topic | Finding | Label |
| --- | --- | --- |
| URL | UUID path `/listings/{id}`; no slug | VERIFIED |
| Metadata | Property-specific when SEO API succeeds | VERIFIED |
| JSON-LD | LodgingBusiness + Breadcrumb; AggregateRating only if `reviewCount > 0` | VERIFIED source |
| Offer | `availability: InStock` whenever `basePrice` set | VERIFIED source — may overclaim |
| LIVE gate | SEO listing API 404 unless LIVE + quality gates | VERIFIED source |
| Invalid ID | HTTP **200**, noindex, explore metadata/canonical | VERIFIED runtime |
| Sitemap | Not included | VERIFIED |

---

## 12. Structured Data / Schema.org

| Route | Schema type | Present | Valid by source inspection | Data consistency risk |
| --- | --- | --- | --- | --- |
| Root layout | Organization | Yes | Source OK | — |
| Stays landing | Organization, WebSite+SearchAction, BreadcrumbList, CollectionPage/ItemList, Tourist*, FAQPage | Yes (runtime ld count 14 on city/combo) | Structurally present | FAQ may template; rich-result eligibility **NOT claimed** |
| Guide | BreadcrumbList, Article, FAQPage | Expected | Source | EN content |
| Listing | BreadcrumbList, LodgingBusiness, AggregateRating?, Offer? | Yes on LIVE sample | AggregateRating gated | Offer always InStock; price may not match UI availability |

**Do not claim Google rich-result eligibility** — NOT MEASURED against Google validators.

---

## 13. Morocco Destination SEO Architecture

**Entities (VERIFIED migrations + API):** Morocco Tier-A cities — marrakech, casablanca, agadir, rabat, fes, tangier, essaouira, chefchaouen, tetouan, ifrane → neighborhoods / landmarks / property-type & amenity combos → listings.

Casablanca sample intelligence: 70 LIVE listings, indexable true, seoScore 91. Nearby Rabat can be `indexable: false` when below thresholds — freshness works (VERIFIED API).

Empty/low inventory: `isPageIndexable` requires `listingCount >= 3` and score ≥ 75 — VERIFIED source.

---

## 14. Keyword / Search Intent Architecture

| Intent pattern | Classification |
| --- | --- |
| Stays in [City] | **Existing indexable page** (`/stays/{city}`) |
| Apartments/Riads/… in [City] | **Existing** (`/stays/{city}/{type}`) |
| Amenity in [City] (pool, wifi, …) | **Existing** combo |
| Neighborhood in [City] | **Existing** combo |
| Explore filters (guests, sort, dates, cursor) | **Search/filter only** — canonicalize to explore |
| Luxury/family/pet | Mix of combo pages + explore flags |

Do **not** auto-create every filter combination — parameter explosion risk already present on explore URLs.

---

## 15. Explore / Listings Page SEO + Query crawl-space

### Parameter matrix (source + runtime)

| Parameter | Purpose | Changes results? | Server SEO? | Indexable meta? | Canonical | SEO risk |
| --- | --- | --- | --- | --- | --- | --- |
| city | Filter | Yes (client) | No | index,follow | → `/listings` | Crawl if linked |
| guests / adults… | Occupancy | Yes | No | index,follow | → base | Low–med |
| sort | Order | Yes | No | index,follow | → base | Crawl trap |
| amenity / pets / luxury / family | Filters | Yes | No | index,follow | → base | Dupe risk |
| near_* / bounds | Geo | Yes | No | index,follow | → base | **Crawl trap** |
| cursor | Pagination | Yes | No | index,follow | → base | **Must not be indexed as unique** |
| layout | UI | No SEO content | No | index,follow | → base | Noise |
| collection | Rails | Yes | No | index,follow | → base | |
| dates | Availability | Yes | No | index,follow | → base | Session-like |
| version | Contract | — | No | — | — | |

**VERIFIED runtime:** `?city=`, `?guests=`, `?sort=`, `?amenity=`, `?layout=`, `?cursor=abc123`, multi-filter → all **200**, canonical **`http://localhost:3005/en/listings`**, robots **index, follow**.

**Interpretation:** Canonicalization is present (good). Residual risk: Google may still crawl parameterized URLs if linked; better as `noindex,follow` or robots disallow for selected params (**PROPOSED**).

---

## 16. Pagination SEO

Cursor pagination is **client explore** — no crawlable `?page=` series. Discovery beyond first paint relies on:

- Sitemap (missing listings)  
- Destination SSR listing anchors (VERIFIED 12 on Casablanca)  
- Guides / hubs  

Cursor URLs are **not** a traditional pagination SEO system; accidental indexability of `?cursor=` is the main risk (canonicalized but still indexable meta).

---

## 17. Internal Linking

| Source | Target | Server-rendered link? | Crawlable | Issue |
| --- | --- | --- | --- | --- |
| City landing | Listing detail | Yes (anchors in HTML) | Yes | Limited count vs inventory |
| City | Combo / neighborhood / nearby | Yes (payload links) | Yes | |
| Explore | Listings | Client | Weak for bots | CSR |
| Listing | City | Breadcrumb JSON-LD + client UI | Partial | |
| Sitemap | Stays/guides/static | Yes | Yes | **No listing URLs** |

Orphans risk: LIVE listings never linked from landings and absent from sitemap — **INFERRED** high for long-tail properties.

---

## 18. Heading and Content Structure

Casablanca: single H1 `Stays in Casablanca` — VERIFIED.  
Combo: H1 `Apartments in Casablanca` — VERIFIED unique vs city.  
Explore: marketing/sr-only patterns — not fully measured for multiple H1s.  
Listing: H1 primarily after CSR — INFERRED.

---

## 19. Image SEO

Listing cards / landings use `next/image`; SEO OG falls back to brand logo. Alt text quality NOT fully sampled. CLS/priority: Leaflet + card images are source-level CWV risks — **VERIFIED source risk**, metrics **NOT MEASURED**.

---

## 20. Performance / CWV Risk Audit

| Risk | Label |
| --- | --- |
| Explore CSR + map (Leaflet) on desktop split | VERIFIED source-level risk |
| Listing detail client refetch | VERIFIED source |
| Large programmatic SEO page client islands | INFERRED |
| Lighthouse / CrUX scores | **NOT MEASURED** |

---

## 21. Accessibility SEO Intersections

Semantic breadcrumbs + listing anchors on landings help crawl. Button-vs-link misuse NOT fully audited. Focus: ensure listing cards remain `<a href>` on landings (VERIFIED pattern via `/listings/{uuid}` hrefs).

---

## 22. Security / Environment SEO Leakage

| Finding | Label |
| --- | --- |
| robots Host + Sitemap → `http://localhost:3005` | VERIFIED local |
| All 258 sitemap locs localhost | VERIFIED |
| Canonicals localhost | VERIFIED |
| Production build throws if SITE_URL missing/loopback | VERIFIED source (`resolvePublicServiceUrl`) |
| Staging/preview leakage | NOT MEASURED |

**P0 if production ever serves with wrong/missing SITE_URL** (historical Phase S1 NO-GO aligns). Local alone is expected.

---

## 23. Backend / DB SEO Scalability

| Topic | Finding |
| --- | --- |
| Sitemap API | Full `find()` indexable+published — no pagination | VERIFIED |
| Freshness | Updates indexable from LIVE listing counts | VERIFIED |
| Listing SEO | LIVE + photo/title/description/score gates | VERIFIED |
| Seeds | 10 Tier-A cities + combos/neighborhoods/guides | VERIFIED |

---

## 24. Duplicate Content / URL Explosion Matrix

| URL family | Uniqueness | Canonical | Indexability | Risk | Recommended strategy |
| --- | --- | --- | --- | --- | --- |
| `/en/listings` vs `?city=` | Same SSR shell | → base listings | index,follow | Crawl budget | noindex params or disallow (**PROPOSED**) |
| `?cursor=` | Same | → base | index,follow | **High trap** | noindex (**PROPOSED**) |
| `?layout=` / `?sort=` | Same | → base | index,follow | Noise | noindex (**PROPOSED**) |
| `/en/stays/casablanca` vs `/apartments` | Unique title/H1/desc (EN) | Self | index if registry | OK EN | Localize FR/AR |
| `/en|fr|ar/stays/casablanca` | **Duplicate English content** | Locale self | index | **Hreflang conflict risk** | Translate or noindex weak locales |
| Guides en/fr/ar | Duplicate titles | Locale self | index | Same | Translate |

---

## 25. Programmatic SEO Quality Audit

| Check | City Casablanca | Combo apartments | Label |
| --- | --- | --- | --- |
| Unique title | Yes (EN) | Yes vs city | VERIFIED |
| Unique description | Yes | Yes | VERIFIED |
| Unique H1 | Yes | Yes | VERIFIED |
| Internal links | Rich | Expected | VERIFIED city |
| Listing relevance | exploreFilters city | type filter | VERIFIED API |
| Low inventory | noindex via freshness | same | VERIFIED source |
| FR/AR unique body | **No** | **No** | VERIFIED |
| Indexable with thin locales | Currently yes | yes | Risk |

**Do not treat SSG/ISR as automatic SEO value** when locales duplicate English.

---

## 26. Defect Matrix

| ID | Severity | Area | Finding | Evidence | Impact | Phase |
| --- | --- | --- | --- | --- | --- | --- |
| SEO-001 | **P0** | Environment | Canonical/robots/sitemap depend on `NEXT_PUBLIC_SITE_URL`; localhost when unset | Runtime Host/Sitemap/canonicals; `lib/env.ts` | Production leakage / wrong domain | Phase 0 |
| SEO-002 | **P1** | Sitemap | **0** listing detail URLs in sitemap | Runtime parse 258 URLs | Properties undiscoverable via sitemap | Phase 0/1 |
| SEO-003 | **P1** | i18n | FR/AR stays + guides titles/H1 identical to EN | Runtime | Hreflang without unique content | Phase 1–2 |
| SEO-004 | **P1** | Explore | `/listings` CSR; static meta only | Source + architecture | Weak compete for “stays in X” via explore | Phase 1 |
| SEO-005 | **P1** | Crawl | Query/cursor URLs index,follow despite canonical to base | Runtime probes | Crawl-budget / soft dupes | Phase 1 |
| SEO-006 | **P1** | Listing | Invalid ID → HTTP 200 soft 404 | Runtime | Index confusion | Phase 0 |
| SEO-007 | **P1** | Listing | Detail body CSR; discovery incomplete without sitemap | Source + sitemap | Thin Google understanding / discovery | Phase 1–2 |
| SEO-008 | **P1** | Robots | Incomplete private path disallow vs all noindex surfaces | Source compare | Minor crawl of app chrome | Phase 1 |
| SEO-009 | **P2** | Sitemap | Static `lastModified: now` every request | `app/sitemap.ts` | Fake freshness | Phase 1 |
| SEO-010 | **P2** | Schema | Offer always `InStock` | `json-ld.ts` | Misleading Offer | Phase 1 |
| SEO-011 | **P2** | Schema | Rich results eligibility unknown | No Google test | — | Phase 1 |
| SEO-012 | **P2** | Scalability | Sitemap registry full-table load | registry service | Memory at scale | Phase 1 |
| SEO-013 | **P2** | Programmatic | Many combos may be thin/near-dupe across amenities | Architecture | Dilution | Phase 2 |
| SEO-014 | **P2** | OG | Localhost OG URLs in local | Runtime | Social previews wrong if leaked | Phase 0 |
| SEO-015 | **P2** | Listing | No public slug URLs | Routes | Weaker memorable URLs | Phase 2–3 |
| SEO-016 | **P3** | A11y/SEO | Full heading audit incomplete | Partial | — | Phase 3 |
| SEO-017 | **P3** | Images | Alt quality not sampled at scale | NOT MEASURED | — | Phase 3 |
| SEO-018 | **P3** | CWV | No production metrics | NOT MEASURED | — | Phase 4 |
| SEO-019 | **P3** | GSC | Indexation unknown | NOT MEASURED | — | Ops |

---

## 27. Bottleneck Matrix

| Rank | Bottleneck | SEO impact | Effort | Priority |
| ---: | --- | --- | --- | --- |
| 1 | Listing discovery (no sitemap + CSR explore) | Critical | Med | P0/P1 |
| 2 | Site URL / environment correctness | Critical if wrong in prod | Low | P0 |
| 3 | EN-only SEO copy under FR/AR URLs | High | High | P1 |
| 4 | Parameterized explore crawl space | High | Low–med | P1 |
| 5 | Soft 404 listings | Med–high | Low | P0/P1 |
| 6 | Programmatic thin/dupe combos | Med | Med | P2 |
| 7 | Schema Offer/availability honesty | Med | Low | P2 |

---

## 28. Recommended Implementation Phases

### Phase 0 — Critical SEO correctness

- Certify production `NEXT_PUBLIC_SITE_URL` (no localhost in robots/sitemap/canonical).  
- Soft-404 → real 404/410 for missing listings.  
- Decide listing sitemap inclusion MVP (LIVE + indexable only, batched).  

### Phase 1 — Technical foundation

- Query/cursor **noindex** or robots rules.  
- Sitemap lastmod honesty; registry pagination.  
- Schema Offer/availability cleanup.  
- Expand robots disallow to match private surfaces.  
- Explore metadata strategy (canonical/noindex policy documented in code).  

### Phase 2 — Destination & property SEO

- Localize FR/AR SEO payloads or noindex untranslated locales.  
- Improve listing SSR content / internal linking density.  
- Programmatic combo quality gates (already partially via freshness — tighten).  

### Phase 3 — Content & growth

- Editorial depth for Tier-A cities; guide translation.  
- Optional public slugs.  

### Phase 4 — Performance

- Only after measurement (Lighthouse/CrUX/GSC).  

**No implementation in this audit turn.**

---

## 29. Validation Matrix

| Area | Test | Result |
| --- | --- | --- |
| robots | Fetch `/robots.txt` | **PASS** (local Host localhost) |
| sitemap | Parse XML | **PASS** count 258 |
| LIVE listing in sitemap | UUID locs | **FAIL** (0) |
| draft listing excluded | SEO API LIVE gate | **PASS** (source) |
| property metadata | LIVE sample title/JSON-LD | **PASS** |
| canonical absolute | Probes | **PASS** form / **FAIL** domain for prod readiness |
| EN/FR/AR stays titles unique | Runtime | **FAIL** (identical) |
| invalid property | Status | **FAIL** (200 soft 404) |
| city page indexable | Casablanca | **PASS** |
| filter URL canonical | Probes | **PASS** → base listings |
| filter URL robots | Probes | **FAIL** desired noindex policy (still index) |
| JSON-LD present | City/listing | **PASS** |
| JSON-LD rich-result eligible | Google tools | **NOT MEASURED** |
| locale alternates | Source builder | **PASS** paths / **FAIL** content parity |
| localhost leakage local | Runtime | Present (expected locally) |
| internal listing links on city | SSR | **PASS** (12) |
| GSC indexation | — | **NOT MEASURED** |
| CWV | — | **NOT MEASURED** |

---

## 30. Required Source / Evidence Index

| File | Why inspected | Key evidence |
| --- | --- | --- |
| `app/robots.ts` | robots generation | Private disallow list |
| `app/sitemap.ts` | sitemap | Static + registry; lastmod=now |
| `lib/env.ts` | site URL | localhost default |
| `lib/seo/metadata.ts` | canonical/hreflang/OG | Builder |
| `lib/seo/static-route-metadata.ts` | explore meta | Not query-aware |
| `lib/seo/json-ld.ts` | schema | LodgingBusiness/Offer/AggregateRating |
| `lib/seo/seo-api.ts` | sitemap fetch | `/registry/sitemap` |
| `middleware.ts` | X-Robots-Tag | Private paths |
| `app/[locale]/stays/**` | landings | ISR + client |
| `app/[locale]/guides/**` | guides | EN slug seed |
| `app/[locale]/listings/page.tsx` | explore | `"use client"` |
| `app/[locale]/listings/[id]/page.tsx` | detail SEO | CSR body |
| `lib/search/explore-filter-utils.ts` | params | Query inventory |
| `backend/stays/.../seo.controller.ts` | APIs | Public routes |
| `seo-page-registry.service.ts` | sitemap filter | indexable+published |
| `seo-listing.service.ts` | LIVE gate | Drafts excluded |
| `seo-quality-scoring.service.ts` | thresholds | min 3 listings / score 75 |
| `seo-freshness-engine.service.ts` | indexable updates | |
| `database/stays/migrations/028`–`032` | seeds | Tier-A Morocco |

Runtime probes: `/robots.txt`, `/sitemap.xml`, `/en|/fr|/ar`, listings ± queries, `/en/stays/casablanca`, `/en/stays/casablanca/apartments`, FR/AR city, guide locales, LIVE listing `3466a54c-…`, invalid UUID.

---

## Explicitly Not Changed

- Host Portal / host dashboards  
- Explore cursor **implementation** / pagination code  
- Payments, booking, auth, KYC  
- DB migrations  
- Visual redesign / explore IA product code  
- No SEO product code fixes in this turn  

---

## Git

See commit after this document is pushed (`docs: add Nexa Stays SEO audit`).
