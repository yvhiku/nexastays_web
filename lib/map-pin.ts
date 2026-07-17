import type { DivIcon, Icon, IconOptions } from "leaflet";

/** Served from `public/images/assets/pin.png` (keep in sync with `images/assets/pin.png`). */
export const NEXA_MAP_PIN_SRC = "/images/assets/pin.png" as const;

export async function createNexaMapPinIcon(
  options?: Partial<IconOptions>,
): Promise<Icon> {
  const L = (await import("leaflet")).default;
  return L.icon({
    iconUrl: NEXA_MAP_PIN_SRC,
    iconRetinaUrl: NEXA_MAP_PIN_SRC,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
    tooltipAnchor: [0, -28],
    className: "nexa-map-pin",
    ...options,
  });
}

/** Airbnb-style price bubble for Explore markers. */
export async function createPriceBubbleIcon(
  label: string,
  selected = false,
): Promise<DivIcon> {
  const L = (await import("leaflet")).default;
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Approximate width from label length so the tip stays centered.
  const width = Math.max(64, Math.min(140, 28 + safe.length * 8));
  const height = 34;

  return L.divIcon({
    className: `nexa-price-bubble${selected ? " is-selected" : ""}`,
    html: `<div class="nexa-price-bubble__body">${safe}</div><div class="nexa-price-bubble__tip" aria-hidden="true"></div>`,
    iconSize: [width, height + 8],
    iconAnchor: [width / 2, height + 8],
  });
}

/** Count bubble used when nearby stays are clustered at lower zoom. */
export async function createClusterCountIcon(count: number): Promise<DivIcon> {
  const L = (await import("leaflet")).default;
  const size = count < 10 ? 42 : count < 50 ? 50 : 58;
  return L.divIcon({
    className: "nexa-cluster",
    html: `<div class="nexa-cluster__body">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function formatListingPriceLabel(listing: {
  rate_plan?: { base_price?: number | null; currency?: string | null } | null;
  title?: string;
}): string {
  const price = listing.rate_plan?.base_price;
  const currency = (listing.rate_plan?.currency || "MAD").toUpperCase();
  if (price == null || !Number.isFinite(Number(price))) {
    return listing.title?.trim() || "Stay";
  }
  return `${Math.round(Number(price))} ${currency}`;
}
