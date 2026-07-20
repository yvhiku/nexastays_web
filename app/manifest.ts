import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/env";
import { PWA_ICONS, PWA_SHORTCUT_ICONS } from "@/lib/pwa-assets";
import { NEXA_PWA_THEME } from "@/lib/pwa-theme";

export default function manifest(): MetadataRoute.Manifest {
  const screenshots = [
    {
      src: "/pwa/screenshots/welcome.png",
      sizes: "412x913",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Welcome to Nexa Stays",
    },
    {
      src: "/pwa/screenshots/explore.png",
      sizes: "410x915",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Find your next stay in Morocco",
    },
    {
      src: "/pwa/screenshots/listing.png",
      sizes: "411x912",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Listing gallery, calendar, and reserve",
    },
    {
      src: "/pwa/screenshots/host.png",
      sizes: "410x913",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Host dashboard with revenue and calendar sync",
    },
  ];

  const siteUrl = getPublicSiteUrl();

  return {
    id: `${siteUrl}/`,
    name: "Nexa Stays",
    short_name: "Nexa Stays",
    description: "Book unique stays across Morocco with Nexa Stays.",
    start_url: "/en?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait",
    background_color: NEXA_PWA_THEME,
    theme_color: NEXA_PWA_THEME,
    categories: ["travel", "lifestyle"],
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: PWA_ICONS.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICONS.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: PWA_ICONS.maskable,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: PWA_ICONS.monochrome,
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
    shortcuts: [
      {
        name: "Search stays",
        short_name: "Search",
        description: "Search verified stays in Morocco",
        url: "/en/listings",
        icons: [{ src: PWA_SHORTCUT_ICONS.explore, sizes: "96x96" }],
      },
      {
        name: "Saved",
        short_name: "Saved",
        url: "/en/saved-listings",
        icons: [{ src: PWA_SHORTCUT_ICONS.saved, sizes: "96x96" }],
      },
      {
        name: "Trips",
        short_name: "Trips",
        url: "/en/my-bookings",
        icons: [{ src: PWA_SHORTCUT_ICONS.trips, sizes: "96x96" }],
      },
      {
        name: "Become a Host",
        short_name: "Host",
        url: "/en/host",
        icons: [{ src: PWA_SHORTCUT_ICONS.host, sizes: "96x96" }],
      },
    ],
    screenshots: screenshots as MetadataRoute.Manifest["screenshots"],
  } as MetadataRoute.Manifest;
}
