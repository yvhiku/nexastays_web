/**
 * Versioned PWA icon paths — single source for layout, manifest, splash, install UI.
 * Bump PWA_ICON_VERSION together with ICON_VERSION in scripts/generate-pwa-icons.ts,
 * then run `npm run generate:pwa`.
 */
export const PWA_ICON_VERSION = "v3";

/** Root favicon for browsers that request /favicon.ico */
export const PWA_FAVICON_ICO = "/favicon.ico" as const;

export const PWA_ICONS = {
  favicon16: `/icons/favicon-16.${PWA_ICON_VERSION}.png`,
  favicon32: `/icons/favicon-32.${PWA_ICON_VERSION}.png`,
  favicon48: `/icons/favicon-48.${PWA_ICON_VERSION}.png`,
  apple: `/icons/apple-touch-180.${PWA_ICON_VERSION}.png`,
  icon192: `/icons/icon-192.${PWA_ICON_VERSION}.png`,
  icon512: `/icons/icon-512.${PWA_ICON_VERSION}.png`,
  maskable: `/icons/maskable-512.${PWA_ICON_VERSION}.png`,
  monochrome: `/icons/monochrome-512.${PWA_ICON_VERSION}.png`,
} as const;

export const PWA_SHORTCUT_ICONS = {
  explore: `/icons/shortcut-explore.${PWA_ICON_VERSION}.png`,
  saved: `/icons/shortcut-saved.${PWA_ICON_VERSION}.png`,
  trips: `/icons/shortcut-trips.${PWA_ICON_VERSION}.png`,
  host: `/icons/shortcut-host.${PWA_ICON_VERSION}.png`,
} as const;

/** Filenames expected under public/icons after generate:pwa-icons. */
export const PWA_ICON_FILENAMES = [
  `favicon-16.${PWA_ICON_VERSION}.png`,
  `favicon-32.${PWA_ICON_VERSION}.png`,
  `favicon-48.${PWA_ICON_VERSION}.png`,
  `apple-touch-180.${PWA_ICON_VERSION}.png`,
  `icon-192.${PWA_ICON_VERSION}.png`,
  `icon-512.${PWA_ICON_VERSION}.png`,
  `maskable-512.${PWA_ICON_VERSION}.png`,
  `monochrome-512.${PWA_ICON_VERSION}.png`,
  `shortcut-explore.${PWA_ICON_VERSION}.png`,
  `shortcut-saved.${PWA_ICON_VERSION}.png`,
  `shortcut-trips.${PWA_ICON_VERSION}.png`,
  `shortcut-host.${PWA_ICON_VERSION}.png`,
  "build.json",
] as const;

export const PWA_SCREENSHOT_FILENAMES = [
  "welcome.png",
  "explore.png",
  "listing.png",
  "host.png",
] as const;
