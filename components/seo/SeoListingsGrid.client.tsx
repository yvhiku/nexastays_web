"use client";

import React from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listing/ListingCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StaysListing } from "@/lib/stays-types";

type Props = {
  listings: StaysListing[];
  city: string;
  emptyMessage: string;
};

export function SeoListingsGrid({ listings, city, emptyMessage }: Props) {
  const { t, tf, localePath } = useLanguage();

  if (listings.length === 0) {
    return (
      <p className="text-sm text-nexa-muted py-8 text-center">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          city={city}
          t={t}
          tf={tf}
          localePath={localePath}
        />
      ))}
    </div>
  );
}

type LinkGridProps = {
  title: string;
  links: { href: string; label: string }[];
};

export function SeoInternalLinkGrid({ title, links }: LinkGridProps) {
  const { localePath } = useLanguage();
  if (links.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-nexa-ink mb-4">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={localePath(link.href.replace(/^\/(en|fr|ar)/, "") || link.href)}
            className="inline-flex items-center rounded-full border border-nexa-border px-4 py-2 text-sm font-medium text-nexa-ink hover:border-nexa-primary hover:text-nexa-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
