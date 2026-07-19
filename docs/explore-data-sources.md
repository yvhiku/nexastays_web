# Explore destination catalog — data sources

Geographic facts in `lib/explore/cities/` come from **OpenStreetMap**, not handwritten estimates.

## Source priority

1. **OpenStreetMap** — primary (center, bounds, OSM ids, place geometry)
2. **Wikidata** — IDs and multilingual aliases
3. **Google Maps** — verification of naming / local usage only (never source of truth; licensing)
4. Local municipality / tourism — only when OSM has gaps in common naming

## Workflow

1. Locate the city relation on OpenStreetMap / Nominatim
2. Extract center, bounding box, OSM relation id
3. Find neighborhoods (suburb / neighbourhood / quarter) via Overpass
4. Verify names against local usage (and Google Maps for naming only)
5. Assign coordinates from OSM relation centroids or place nodes
6. Add **editorial** fields: descriptor, featuredOrder, searchWeight, popularity, city tag, region
7. Commit; run `npm run validate:explore-catalog`

## Tools

- [OpenStreetMap](https://www.openstreetmap.org)
- [Overpass Turbo](https://overpass-turbo.eu)
- [Nominatim](https://nominatim.openstreetmap.org) — e.g. `?q=Maarif,Casablanca,Morocco&format=jsonv2&addressdetails=1`
- [Wikidata](https://www.wikidata.org)

## Descriptors

Descriptors (`shopping_cafes`, `beachfront`, …) are **editorial product metadata**. They are not imported from OSM.

## Automation

`scripts/import-explore-city.ts` scaffolds a draft city module from Nominatim. Always review editorial fields before commit.

## Catalog version

See `lib/explore/version.ts` (`CATALOG_VERSION`).
