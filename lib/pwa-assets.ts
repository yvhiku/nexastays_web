/**
 * Brand / PWA asset paths — single logo file + root favicon.
 * Source artwork: public/images/nexastays.png
 */
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";

/** Root favicon for browsers that request /favicon.ico */
export const PWA_FAVICON_ICO = "/favicon.ico" as const;

/** Real Nexa Stays logo (browser, splash, install UI, manifest). */
export const PWA_LOGO = NEXA_STAYS_LOGO_SRC;

/** @deprecated Use PWA_LOGO — kept for call-site compatibility */
export const PWA_ICONS = {
  favicon16: PWA_FAVICON_ICO,
  favicon32: PWA_FAVICON_ICO,
  favicon48: PWA_FAVICON_ICO,
  apple: PWA_LOGO,
  icon192: PWA_LOGO,
  icon512: PWA_LOGO,
  maskable: PWA_LOGO,
  monochrome: PWA_LOGO,
} as const;

/** Shortcuts reuse the same logo. */
export const PWA_SHORTCUT_ICONS = {
  explore: PWA_LOGO,
  saved: PWA_LOGO,
  trips: PWA_LOGO,
  host: PWA_LOGO,
} as const;

export const PWA_SCREENSHOT_FILENAMES = [
  "welcome.png",
  "explore.png",
  "listing.png",
  "host.png",
] as const;
