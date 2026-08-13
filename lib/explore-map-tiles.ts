/**
 * Explore map basemap — CARTO CDN (no API key).
 * Primary: Voyager (geographic color hierarchy). Positron archived as named constant only
 * (no runtime provider switching).
 */

/** Active basemap — CARTO Voyager. */
export const NEXA_EXPLORE_TILE_URL_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" as const;

/** Archived — Positron (light_all); too washed out for Explore. Do not use as primary. */
export const NEXA_EXPLORE_TILE_URL_POSITRON =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" as const;

/** Primary tile URL — Voyager. */
export const NEXA_EXPLORE_TILE_URL = NEXA_EXPLORE_TILE_URL_VOYAGER;

/**
 * Linked OSM + CARTO attribution (required). No Leaflet prefix —
 * Leaflet branding is omitted via attributionControl: false.
 */
export const NEXA_EXPLORE_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> · <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

export const NEXA_EXPLORE_TILE_OPTIONS = {
  attribution: NEXA_EXPLORE_TILE_ATTRIBUTION,
  maxZoom: 20,
  subdomains: "abcd",
} as const;
