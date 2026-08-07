# Morocco Travel Knowledge Graph

Phase: S2  
Application: `nexastays_web`  
Last updated: 2026-07-28

## Purpose

The Nexa Stays travel knowledge graph connects public destinations, local
areas, guides, marketplace inventory, stay types, amenities, and verified
editorial points of interest.

It is a frontend relationship layer over existing SEO and marketplace payloads.
It does not create facts, infer geographic claims, or change backend business
logic.

## Architectural boundary

The graph is implemented in:

```text
lib/seo/entity-graph.ts
```

Presentation consumes the graph through:

```text
components/seo/EntityRelationshipHub.tsx
components/seo/SemanticBreadcrumbs.tsx
```

Structured data consumes the same graph and breadcrumb selectors through:

```text
lib/seo/json-ld.ts
```

This creates one relationship source for visible navigation and machine-readable
page semantics.

## Entity model

Every entity has:

- Stable typed identifier
- Entity kind
- Slug
- Locale
- Localized display name from the active payload
- Optional source-backed summary
- Canonical internal route
- Optional coordinates
- Optional parent
- Source classification
- Last-updated value

Supported entity kinds are:

```text
country
region
city
district
neighborhood
landmark
attraction
beach
mountain
airport
train_station
university
business_district
shopping_center
hospital
transportation_hub
guide
listing
property_type
amenity
```

The type system intentionally supports future verified entities. An entity kind
does not appear in the graph or UI merely because its type exists.

## Relationships

Supported explicit relationship types are:

```text
contains
near
belongs_to
serves
related_to
located_in
accessible_from
featured_in
recommended_for
```

Each relationship declares its source:

- `registry` — backend SEO destination/relationship registry
- `marketplace` — live listing or listing SEO payload
- `editorial` — reviewed guide or page content

## Current verified inputs

Phase S2 currently resolves entities from fields already returned by Nexa:

| Input | Entities / relationships |
| --- | --- |
| Destination payload | Morocco, city, coordinates, country containment |
| Neighborhood payload and links | City → neighborhood containment |
| Landmark payload | Landmark location and coordinates |
| `nearbyDestinations` | Explicit `near` city relationships |
| `relatedDestinations` | Backend-declared near/related relationships |
| Property-type links | Property types recommended for the page entity |
| Amenity links | Amenities recommended for the page entity |
| City and related guides | Editorial guide relationships |
| Nearby POI content | Editorial attractions only when an internal verified link exists |
| Filtered listing results | Marketplace listings featured for the page |
| Listing SEO payload | Listing → city/neighborhood/property-type relationships |

No relationship is derived from keyword similarity or generated prose.

## Explicitly deferred entities

The following types remain hidden until an authoritative backend or reviewed
editorial source supplies stable IDs, localized names, routes, and explicit
relationships:

- Regions
- Districts not represented as neighborhoods
- Beaches not represented by verified landmarks/POIs
- Mountains
- Airports
- Train stations
- Universities
- Business districts
- Shopping centers
- Hospitals
- Other transportation hubs
- Restaurants

The UI degrades by omitting empty groups. It never shows “coming soon” or
unsupported placeholders.

## Semantic breadcrumbs

Visible breadcrumbs and JSON-LD breadcrumbs use the same pure selectors.

Examples:

```text
Morocco → Casablanca → Maarif

Morocco → Casablanca → Apartments

Morocco → Guides → Casablanca → Casablanca travel guide

Morocco → Casablanca → Maarif → Listing
```

Breadcrumb names and routes are locale-specific. Arabic starts with `المغرب`,
French with `Maroc`, and English with `Morocco`.

## Relationship hub

The visible entity hub groups only relationships available for the current
entity:

- Places and nearby areas
- Transportation
- Local points of interest
- Related guides
- Property types
- Amenities
- Related stays

The hub:

- Uses semantic section headings and lists
- Is keyboard accessible
- Uses localized labels
- Supports RTL
- Displays source and last-updated provenance
- Limits each group to a bounded number of links
- Makes no client-side API request
- Reuses the page payload and already-fetched listings

The hub replaces repetitive generic link grids on SEO landing pages and the
separate related-guide grid on guide pages.

## Structured data

JSON-LD continues to use truthful page entities:

- `CollectionPage` and `ItemList` for aggregate landing pages
- `Article` for guides
- `LodgingBusiness` for individual listings
- `Place`, `City`, `Country`, and `TouristAttraction` where appropriate
- `DefinedTerm` references for property types and amenities
- `BreadcrumbList`

Related visible entities are referenced through `mentions`. The graph does not
promote a relationship to a Schema.org property unless that property is
supported and the relationship is visible.

## Integrity validation

`validateEntityGraph()` detects:

- Duplicate entity identifiers
- Duplicate kind/slug pairs
- Dangling relationships
- Self-relationships
- Duplicate relationships
- Missing localized names
- Invalid locale routes
- Circular parent hierarchies
- Orphan graph nodes

Validation is covered by:

```text
lib/__tests__/seo-entity-graph.test.ts
```

Tests also verify:

- Relationship resolution
- EN/FR/AR routing
- Semantic breadcrumb order
- Plural property-type routes
- Visible/JSON-LD breadcrumb equivalence
- Safe fallback behavior
- Rejection of dangling and circular graphs

## Performance

The knowledge graph:

- Is derived from server-provided props
- Does not introduce a graph API call
- Does not add a client fetch
- Preserves existing static generation and revalidation
- Memoizes derivation in client page shells
- Bounds displayed relationship groups
- Reuses existing listing results

## Adding a new entity source

A new source is eligible only when it provides:

1. Stable identifier and slug
2. Approved localized name
3. Canonical public route
4. Explicit relationship to an existing entity
5. Source classification
6. Last-updated timestamp
7. Coordinates where the relationship depends on location

Implementation steps:

1. Add the source field to the backend SEO payload.
2. Extend the relevant frontend DTO.
3. Resolve the entity and relationship in `entity-graph.ts`.
4. Add a visible group only if no current group fits.
5. Add integrity and localization tests.
6. Add matching structured-data references only when Schema.org semantics are
   supported and visible.

## Known limitations

- Dynamic FR/AR backend SEO content remains English in the current dataset.
  The graph preserves locale routes but cannot manufacture localized entity
  copy.
- Listing-to-guide and listing-to-attraction relationships are not available
  in the current listing SEO payload.
- Similar listings remain driven by the existing listing UI search rather than
  the SEO entity graph.
- National property/amenity pages identified as orphaned during S1 require
  backend relationship coverage or intentional links from suitable hubs.
- The graph is page-scoped. A global graph export/API is not introduced in S2.

## Success boundary

Phase S2 establishes a connected, validated entity architecture for every
relationship that Nexa Stays can currently prove. It deliberately does not
claim comprehensive coverage of Morocco’s airports, institutions, businesses,
or transport network without authoritative data.

