import React from "react";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import { dmSans, playfair } from "@/app/fonts/brand-fonts";
import "./globals.css";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { getPublicSiteUrl } from "@/lib/env";
import { PWA_FAVICON_ICO, PWA_ICONS } from "@/lib/pwa-assets";
import { NEXA_PWA_THEME } from "@/lib/pwa-theme";
import { serializeJsonLd } from "@/lib/seo/safe-json-ld";
import { ClientMonitoring } from "@/components/monitoring/ClientMonitoring";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nexa Stays | Verified Stays in Morocco",
  description:
    "Nexa Stays is a Moroccan verified-stays platform built for more safety, transparency, and comfort for guests and hosts.",
  applicationName: "Nexa Stays",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nexa Stays",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  alternates: {
    languages: {
      en: "/en",
      fr: "/fr",
      ar: "/ar",
      "x-default": "/en",
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Nexa Stays",
    title: "Nexa Stays | Verified Stays in Morocco",
    description:
      "Book verified stays in Morocco with transparent fees, identity checks, and safer guest-host experiences.",
    images: [{ url: NEXA_STAYS_LOGO_SRC, width: 512, height: 512, alt: "Nexa Stays" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexa Stays | Verified Stays in Morocco",
    description:
      "Verified stays in Morocco with safety, transparency, and comfort for guests and hosts.",
    images: [NEXA_STAYS_LOGO_SRC],
  },
  icons: {
    icon: [
      { url: PWA_ICONS.favicon32, sizes: "32x32", type: "image/png" },
      { url: PWA_ICONS.favicon16, sizes: "16x16", type: "image/png" },
      { url: PWA_ICONS.favicon48, sizes: "48x48", type: "image/png" },
      { url: PWA_FAVICON_ICO, sizes: "any" },
      { url: PWA_ICONS.icon192, sizes: "192x192", type: "image/png" },
      { url: PWA_ICONS.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: PWA_ICONS.apple, sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: NEXA_PWA_THEME,
};

export default async function RootLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }
) {
  const localeHeader = (await headers()).get("x-nexa-locale");
  const locale =
    localeHeader === "fr" || localeHeader === "ar" ? localeHeader : "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nexa Stays",
    url: siteUrl,
    logo: `${siteUrl}${NEXA_STAYS_LOGO_SRC}`,
    areaServed: "MA",
    sameAs: [],
  };

  return (
    <html lang={locale} dir={dir} className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientMonitoring />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-layer-modal focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-nexa-ink focus:shadow-nexa-card"
        >
          Skip to main content
        </a>
        <div id="main-content" tabIndex={-1}>{children}</div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </body>
    </html>
  );
}
