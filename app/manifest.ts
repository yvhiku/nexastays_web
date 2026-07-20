import type { MetadataRoute } from "next";
import { NEXA_PWA_THEME } from "@/lib/pwa-theme";

export default function manifest(): MetadataRoute.Manifest {
  const screenshots = [
    {
      src: "/pwa/screenshots/explore.png",
      sizes: "390x844",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Find your next stay in Morocco",
    },
    {
      src: "/pwa/screenshots/listing.png",
      sizes: "390x844",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Listing gallery, calendar, and reserve",
    },
    {
      src: "/pwa/screenshots/host.png",
      sizes: "390x844",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Host dashboard with revenue and calendar sync",
    },
  ];

  return {
    name: "Nexa Stays",
    short_name: "Nexa Stays",
    description: "Book unique stays across Morocco with Nexa Stays.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: NEXA_PWA_THEME,
    theme_color: NEXA_PWA_THEME,
    categories: ["travel", "lifestyle"],
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-monochrome-512.png",
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
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Saved",
        short_name: "Saved",
        url: "/en/saved-listings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Trips",
        short_name: "Trips",
        url: "/en/my-bookings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Become a Host",
        short_name: "Host",
        url: "/en/host",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: screenshots as MetadataRoute.Manifest["screenshots"],
  };
}
