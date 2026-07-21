"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { SeoListingsGrid } from "@/components/seo/SeoListingsGrid.client";
import { SeoTrustSignalsLight } from "@/components/seo/landing/SeoTrustSignals";
import { formatLastmod } from "@/components/seo/landing/utils";
import type { StaysListing } from "@/lib/stays-types";

type SortKey = "recommended" | "price" | "rating" | "newest";

type Props = {
  title: string;
  subline: string;
  listings: StaysListing[];
  city: string;
  emptyMessage: string;
  sortLabels: Record<SortKey, string>;
  locale: string;
};

export function SeoLandingListings({
  title,
  subline,
  listings,
  city,
  emptyMessage,
  sortLabels,
  locale,
}: Props) {
  const [sort, setSort] = useState<SortKey>("recommended");

  const sorted = useMemo(() => {
    const copy = [...listings];
    const priceOf = (l: StaysListing) => l.rate_plan?.base_price ?? Infinity;
    const hasWalk = (l: StaysListing) =>
      l.media?.some((m) => m.kind === "WALKTHROUGH") ?? false;
    switch (sort) {
      case "price":
        return copy.sort((a, b) => priceOf(a) - priceOf(b));
      case "rating":
        return copy.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
      case "newest":
        return copy;
      default:
        return copy.sort((a, b) => {
          const scoreA = (a.avg_rating ?? 0) * 10 + (hasWalk(a) ? 5 : 0);
          const scoreB = (b.avg_rating ?? 0) * 10 + (hasWalk(b) ? 5 : 0);
          return scoreB - scoreA;
        });
    }
  }, [listings, sort]);

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-nexa-ink">{title}</h2>
          <p className="text-sm text-nexa-muted mt-1">{subline}</p>
          <div className="mt-2">
            <SeoTrustSignalsLight />
          </div>
        </div>
        {listings.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-nexa-muted">Sort:</span>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={`rounded-full px-3 py-1 border transition-colors ${
                  sort === key
                    ? "border-nexa-primary bg-nexa-primary/10 text-nexa-primary font-medium"
                    : "border-nexa-border text-nexa-ink hover:border-nexa-primary/50"
                }`}
              >
                {sortLabels[key]}
              </button>
            ))}
          </div>
        )}
      </div>
      <SeoListingsGrid listings={sorted} city={city} emptyMessage={emptyMessage} />
    </section>
  );
}

export function buildListingsSubline(
  count: number,
  lastmod: string,
  locale: string,
  template: string,
): string {
  return template.replace("{count}", String(count)).replace("{updated}", formatLastmod(lastmod, locale));
}
