# Nexa Stays SEO and GEO: Current State

Last updated: 2026-07-26  
Application: `nexastays_web`

Production certification status: **No-Go**. See
[`PHASE_S1_PRODUCTION_SEO_CERTIFICATION.md`](./PHASE_S1_PRODUCTION_SEO_CERTIFICATION.md)
for live-domain evidence, release-candidate metrics, and blockers.

The Phase S2 entity relationship architecture is documented in
[`MOROCCO_TRAVEL_KNOWLEDGE_GRAPH.md`](./MOROCCO_TRAVEL_KNOWLEDGE_GRAPH.md).

## Purpose

This document explains the search engine optimization (SEO) and generative
engine optimization (GEO) capabilities currently implemented in Nexa Stays.

In this project:

- **SEO** means making public pages discoverable, indexable, understandable,
  and correctly localized for traditional search engines.
- **GEO** means structuring trustworthy, direct, source-backed information so
  answer engines and AI-assisted search can understand and cite Nexa Stays
  content.

GEO is not treated as keyword stuffing or hidden AI copy. It builds on the same
public, useful, structured content used by guests.

## Current architecture

The web application uses Next.js App Router with server-rendered and statically
generated public routes. SEO data is supplied by the Stays API and represented
in the frontend by the types in `lib/seo/types.ts`.

The main frontend SEO layer is:

```text
Stays SEO API
    |
    +-- destinations and programmatic landing pages
    +-- guides
    +-- public listing SEO records
    +-- dynamic sitemap registry
    |
Next.js server routes
    |
    +-- localized metadata
    +-- canonical and hreflang links
    +-- JSON-LD structured data
    +-- indexability decisions
    +-- server-rendered editorial and marketplace content
```

The primary API integrations are:

- `GET /stays/seo/destinations`
- `GET /stays/seo/pages/:segment`
- `GET /stays/seo/pages/:segment/:combo`
- `GET /stays/seo/guides`
- `GET /stays/seo/guides/:slug`
- `GET /stays/seo/listings/:listingId`
- `GET /stays/seo/registry/sitemap`

SEO page and guide data is normally revalidated every 24 hours. Public listing
SEO data and listing results use a shorter one-hour cache where appropriate.
API failures degrade to missing content or a not-found response rather than
fabricating indexable information.

## Public search coverage

### Localized static pages

English, French, and Arabic metadata is implemented for:

- Home
- Listings
- Host acquisition
- About
- Contact
- Fees
- Safety and transparency
- Terms
- Privacy
- Refund policy

These pages receive unique titles and descriptions through
`lib/seo/static-route-metadata.ts`.

### Programmatic destination pages

The application supports localized landing pages for:

- Cities
- Neighborhoods
- Property types
- Amenities
- City and property-type combinations
- City and amenity combinations
- Landmarks and nearby stays

Examples of supported property types include apartments, hotels, riads, villas,
and hostels. Current amenity segments include pool, pet-friendly, free parking,
Wi-Fi, family, and luxury.

The static frontend catalog currently contains destination and neighborhood
coverage for Moroccan markets including Marrakech, Casablanca, Agadir, Rabat,
Fes, Tangier, Essaouira, Chefchaouen, Tetouan, and Ifrane. The backend registry
remains the authority for whether an individual page is indexable.

### Guides

Localized guide pages support:

- Travel guides
- Experience guides
- Seasonal guides
- Event guides

Guide HTML is sanitized again at the frontend boundary before rendering.
Guides can link to a destination, marketplace results, related guides, and
direct-answer content.

### Public listing pages

Individual listings can expose localized:

- Title and description
- Canonical and language alternatives
- Social preview image
- Property and location information
- Price and currency
- Rating and review count
- Geographic coordinates
- Breadcrumbs

Unavailable or non-indexable listings are not presented to crawlers as valid
public entities.

## Metadata and international targeting

`lib/seo/metadata.ts` creates:

- Page title
- Meta description
- Canonical URL
- English, French, and Arabic language alternatives
- `x-default`
- Index/follow directives
- Open Graph metadata
- Twitter large-card metadata

The sitemap also publishes language alternatives for static and dynamic URLs.
Duplicate URLs are removed deterministically.

Localized responses receive a `Content-Language` header. Arabic routes apply
RTL layout and an Arabic font after entering the locale application shell.

## Structured data

Structured data is generated in `lib/seo/json-ld.ts` and safely serialized with
`lib/seo/safe-json-ld.ts`.

Current schema coverage includes:

- `Organization` for Nexa Stays
- `BreadcrumbList`
- `CollectionPage`
- `ItemList`
- `Place` and destination entities
- `FAQPage`-style question and answer content where supported
- `Article` for guides
- `LodgingBusiness` for an individual listing
- `PostalAddress`
- `GeoCoordinates`
- `AggregateRating` only when ratings exist
- `Offer` only when real price data exists

Aggregate destination/search pages intentionally use `CollectionPage` and
`ItemList`, not `LodgingBusiness`. This avoids representing a collection of
properties as one hotel or attaching unsupported offers to the wrong entity.

Dynamic text is escaped before insertion into JSON-LD script elements so it
cannot terminate the script tag.

## GEO capabilities

### Direct-answer blocks

SEO payloads support `geoBlocks`, which contain a clear question and concise
answer. These are rendered as visible page content through
`components/seo/GeoBlock.tsx`.

This format helps both guests and answer engines find self-contained answers
without relying on hidden content.

### Marketplace intelligence

Destination pages can publish structured marketplace facts from existing
Nexa Stays data, including:

- Listing count
- Verified listing count and percentage
- Average, minimum, and maximum nightly price
- Currency
- Luxury inventory count
- Average rating and review count
- Top neighborhood
- Best month or time to visit
- Common amenities
- Common property type

The UI omits a fact when its source value does not exist. It does not invent
statistics.

### AI-oriented snippets

The SEO model supports typed `aiSnippets` for:

- Summary
- Price
- Safety
- Transport
- Family travel
- Nightlife
- Couples
- Digital nomads
- Amenities
- Seasonality

Every snippet carries a confidence value and a declared source:

- `marketplace`
- `editorial`
- `ai_draft`

This data model provides the foundation for provenance-aware GEO content.
Whether a snippet is indexable and visible still depends on the backend page
payload and frontend presentation.

### Rich destination content

Landing pages can contain:

- Hero summaries
- Reasons to stay
- Highlights
- Ideal traveler profiles
- Pros, cons, and “avoid if” guidance
- Local and travel tips
- Transport details
- Seasonal notes
- Nearby points of interest
- Destination comparisons
- Frequently asked questions
- Quick facts and at-a-glance facts
- Related destinations, property types, amenities, neighborhoods, and guides

These sections make entities and relationships explicit while creating useful
internal links. The content is visible to users rather than generated only for
crawlers.

## Crawling and indexability policy

### Intended to be indexed

- Localized home pages
- Public listings search
- Stays and destination landing pages
- Guides
- Available public listings
- Public host acquisition pages
- About, contact, fees, safety, terms, privacy, and refund pages

### Intentionally excluded

- Login and registration
- Inbox and conversation threads
- Bookings and review-management routes
- My bookings
- Profile
- Saved listings
- Host dashboard
- Host listing creation and editing
- API routes

Private routes use multiple controls:

- Page metadata with `noindex`
- HTTP `X-Robots-Tag`
- `robots.txt` crawl exclusions

`robots.txt` is a crawl-budget control, not a security mechanism.

## Sitemap and discovery

`app/sitemap.ts` includes:

- All public static routes for EN, FR, and AR
- Dynamic paths returned by the Stays SEO registry
- Per-entry last-modified values
- Priorities and change frequencies
- Language alternatives
- URL deduplication

`app/robots.ts` advertises the sitemap and configured public host while
excluding private and framework/API paths.

## Trust, safety, and quality controls

The current implementation follows these rules:

- Structured data reflects the real page entity.
- Ratings are emitted only when rating data exists.
- Offers are emitted only when price data exists.
- Missing GEO facts are hidden rather than fabricated.
- Non-indexable records respect backend robot directives.
- Curated guide HTML is sanitized at the frontend trust boundary.
- JSON-LD is safely serialized.
- Public and private route policies have automated regression coverage.
- EN, FR, and AR translation bundles currently have matching key coverage.

The relevant regression suite is
`lib/__tests__/seo-accessibility-i18n-audit.test.ts`.

## Known gaps and limitations

The following work is not complete:

1. **No dedicated AI crawler policy.** There is currently no explicit policy
   for agents such as GPTBot or other model-training and answer-engine
   crawlers. All bots receive the general `robots.txt` rules.
2. **No `llms.txt`.** The site does not currently publish an `llms.txt` or
   equivalent machine-readable overview. This is optional and not a substitute
   for crawlable HTML, metadata, or structured data.
3. **No completed production Search Console validation.** Index coverage,
   discovered canonicals, enhancements, and crawl errors must be confirmed
   after deployment.
4. **No production answer-engine citation baseline.** Visibility and citations
   across Google AI Overviews, Bing/Copilot, ChatGPT search, Perplexity, and
   similar products have not yet been measured.
5. **Initial HTML locale attributes need improvement.** The root document starts
   with English language metadata and locale behavior is completed by the
   localized shell and response header. Server-rendered `<html lang>` and
   `dir` should eventually be locale-native before hydration.
6. **Some literal English UI copy remains.** Listing, review, and host flows
   still require a copy-approved French and Arabic localization pass.
7. **Social imagery is basic.** Dedicated localized 1200×630 Open Graph images
   are not yet available for the main page families.
8. **Dynamic coverage depends on production data.** Orphan pages, broken
   internal links, thin pages, and actual sitemap completeness cannot be fully
   certified without the production SEO registry and listing inventory.
9. **No production Lighthouse/Search crawl certification.** Real measurements
   require deployed pages with healthy production APIs and media.

## Recommended next steps

### Priority 1: production validation

- Connect Google Search Console and Bing Webmaster Tools.
- Submit and monitor `sitemap.xml`.
- Inspect representative city, combination, guide, and listing URLs.
- Validate canonical selection, hreflang, robots, and rich results.
- Crawl the production site for broken links, orphan pages, duplicate titles,
  thin content, redirect chains, and accidental indexation.

### Priority 2: GEO measurement

- Define a stable set of high-intent Morocco travel questions.
- Record whether Nexa Stays is mentioned or cited by major answer engines.
- Track citation URL, quoted fact, locale, freshness, and correctness.
- Improve weak pages using verified marketplace and editorial evidence.
- Never publish low-confidence `ai_draft` text as authoritative fact without
  review.

### Priority 3: entity and content maturity

- Create dedicated localized social preview images.
- Complete approved French and Arabic copy extraction.
- Strengthen author/editorial provenance and update dates on guides.
- Add visible source or methodology context for marketplace statistics where
  users need it.
- Continue building internal links between destinations, guides, landmarks,
  property types, amenities, and live listings.

### Priority 4: optional machine-readable discovery

- Decide and document the company’s AI crawler policy.
- Consider an `llms.txt` only as a supplementary discovery aid.
- If added, keep it concise, public, factual, and linked to canonical HTML
  sources; do not expose private APIs or user data.

## Key implementation files

```text
app/robots.ts
app/sitemap.ts
app/[locale]/stays/[segment]/page.tsx
app/[locale]/stays/[segment]/[combo]/page.tsx
app/[locale]/guides/[slug]/page.tsx
app/[locale]/listings/[id]/page.tsx
lib/seo/metadata.ts
lib/seo/static-route-metadata.ts
lib/seo/json-ld.ts
lib/seo/safe-json-ld.ts
lib/seo/sanitize-content-html.ts
lib/seo/seo-api.ts
lib/seo/guide-api.ts
lib/seo/listing-api.ts
lib/seo/catalog.ts
lib/seo/types.ts
components/seo/
lib/__tests__/seo-accessibility-i18n-audit.test.ts
```

## Current assessment

Nexa Stays has a substantial technical SEO foundation and an unusually strong
GEO-ready content model for a hospitality marketplace. The application already
supports localized programmatic discovery pages, entity-aware structured data,
direct-answer blocks, factual marketplace intelligence, guides, internal
relationships, and strict private-route index controls.

The next maturity step is not adding more unsupported content. It is validating
the production crawl, measuring real search and answer-engine visibility,
improving provenance, completing localization, and maintaining factual
freshness as inventory grows.
