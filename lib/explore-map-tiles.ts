/**
 * Explore map basemap — CARTO CDN (no API key).
 * Primary: Positron (calm, marker-first). Voyager kept as named fallback only
 * (swap NEXA_EXPLORE_TILE_URL manually if Positron fails QA — no runtime switch).
 */

/** Named fallback — previous production Voyager style. */
export const NEXA_EXPLORE_TILE_URL_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" as const;

/** Primary: CARTO Positron (light_all). */
export const NEXA_EXPLORE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" as const;

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
