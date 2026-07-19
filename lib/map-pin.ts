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

/** Calm white price capsule for Explore markers. */
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

  const width = Math.max(68, Math.min(148, 30 + safe.length * 7.5));
  const height = 32;

  return L.divIcon({
    className: `nexa-price-bubble${selected ? " is-selected" : ""}`,
    html: `<div class="nexa-price-bubble__body">${safe}</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
  });
}

/** Friendly cluster pill — e.g. "7 stays". */
export async function createClusterCountIcon(
  count: number,
  staysLabel: string,
): Promise<DivIcon> {
  const L = (await import("leaflet")).default;
  const label = `${count} ${staysLabel}`;
  const safe = label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const width = Math.max(72, Math.min(120, 36 + safe.length * 7));
  const height = 34;

  return L.divIcon({
    className: "nexa-cluster",
    html: `<div class="nexa-cluster__body">${safe}</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
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
