import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";
import { getPublicSiteUrl } from "@/lib/env";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Nexa Stays | Verified Stays in Morocco",
  description:
    "Nexa Stays is a Moroccan verified-stays platform built for more safety, transparency, and comfort for guests and hosts.",
  alternates: {
    canonical: "/en",
    languages: {
      en: "/en",
      fr: "/fr",
      ar: "/ar",
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
    icon: [{ url: NEXA_STAYS_LOGO_SRC, type: "image/png" }],
    apple: [{ url: NEXA_STAYS_LOGO_SRC, type: "image/png" }],
  },
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Nexa Stays",
    url: siteUrl,
    logo: `${siteUrl}${NEXA_STAYS_LOGO_SRC}`,
    areaServed: "MA",
    sameAs: [],
  };

  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-nexa-ink focus:shadow-nexa-card"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
