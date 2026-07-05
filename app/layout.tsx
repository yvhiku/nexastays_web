import React from "react";
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { NEXA_STAYS_LOGO_SRC } from "@/lib/brand-assets";

export const metadata: Metadata = {
  title: "Nexa Stays | Verified Stays in Morocco",
  description:
    "Nexa Stays is a Moroccan verified-stays platform built for more safety, transparency, and comfort for guests and hosts.",
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
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
