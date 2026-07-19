import type { MetadataRoute } from "next";
import { NEXA_PWA_THEME } from "@/lib/pwa-theme";

export default function manifest(): MetadataRoute.Manifest {
  const screenshots = [
    {
      src: "/pwa/screenshots/narrow.png",
      sizes: "390x844",
      type: "image/png",
      form_factor: "narrow" as const,
      label: "Explore verified stays in Morocco",
    },
    {
      src: "/pwa/screenshots/wide.png",
      sizes: "1280x720",
      type: "image/png",
      form_factor: "wide" as const,
      label: "Nexa Stays desktop browse",
    },
  ];

  return {
    name: "Nexa Stays",
    short_name: "Nexa Stays",
    description:
      "Verified stays in Morocco — book safer, transparent guest and host experiences.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
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
    ],
    shortcuts: [
      {
        name: "Explore",
        short_name: "Explore",
        description: "Search verified stays in Morocco",
        url: "/en/listings",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Wishlist",
        short_name: "Wishlist",
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
    // Next's Manifest type lags Web App Manifest screenshot fields (form_factor / label).
    screenshots: screenshots as MetadataRoute.Manifest["screenshots"],
  };
}
