/** Carto Voyager — soft color so Morocco feels alive; markers still dominate. */
export const NEXA_EXPLORE_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" as const;

export const NEXA_EXPLORE_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const NEXA_EXPLORE_TILE_OPTIONS = {
  attribution: NEXA_EXPLORE_TILE_ATTRIBUTION,
  maxZoom: 20,
  subdomains: "abcd",
} as const;
