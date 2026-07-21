import React from "react";
import type { DestinationIntelligence } from "@/lib/seo/types";

type Props = {
  destinationName: string;
  intelligence: DestinationIntelligence;
  bestTimeToVisit?: string | null;
  labels: {
    title: string;
    verifiedStays: string;
    avgPrice: string;
    cheapest: string;
    luxury: string;
    avgRating: string;
    topArea: string;
    bestMonth: string;
    topAmenities: string;
    topPropertyType?: string;
    verifiedPercent?: string;
    perNight: string;
  };
};

export function DestinationIntelligencePanel({
  destinationName,
  intelligence,
  bestTimeToVisit,
  labels,
}: Props) {
  const { currency } = intelligence;
  const rows: { label: string; value: string }[] = [];

  if (intelligence.listingCount > 0) {
    rows.push({
      label: labels.verifiedStays,
      value: `${intelligence.listingCount}${intelligence.verifiedCount > 0 ? ` (${intelligence.verifiedCount} verified walkthrough)` : ""}`,
    });
  }
  if (intelligence.avgNightlyPrice != null) {
    rows.push({
      label: labels.avgPrice,
      value: `${intelligence.avgNightlyPrice} ${currency}${labels.perNight}`,
    });
  }
  if (intelligence.minPrice != null) {
    rows.push({
      label: labels.cheapest,
      value: `${intelligence.minPrice} ${currency}${labels.perNight}`,
    });
  }
  if (intelligence.luxuryCount > 0) {
    rows.push({ label: labels.luxury, value: String(intelligence.luxuryCount) });
  }
  if (intelligence.avgRating != null) {
    rows.push({ label: labels.avgRating, value: String(intelligence.avgRating) });
  }
  if (intelligence.topNeighborhood) {
    rows.push({ label: labels.topArea, value: intelligence.topNeighborhood });
  }
  if (bestTimeToVisit) {
    rows.push({ label: labels.bestMonth, value: bestTimeToVisit });
  }
  if (intelligence.topAmenities.length > 0) {
    rows.push({
      label: labels.topAmenities,
      value: intelligence.topAmenities.join(" · "),
    });
  }
  if (intelligence.topPropertyType && labels.topPropertyType) {
    rows.push({ label: labels.topPropertyType, value: intelligence.topPropertyType });
  }
  if (intelligence.verifiedPercent != null && labels.verifiedPercent) {
    rows.push({ label: labels.verifiedPercent, value: `${intelligence.verifiedPercent}%` });
  }

  if (rows.length === 0) return null;

  return (
    <section
      className="rounded-[22px] border border-nexa-border/80 bg-nexa-surface/40 p-6 sm:p-8"
      aria-label={`${destinationName} marketplace statistics`}
    >
      <h2 className="font-display text-lg sm:text-xl font-semibold text-nexa-ink mb-5">
        {labels.title.replace("{city}", destinationName)}
      </h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-nexa-muted">
              {row.label}
            </dt>
            <dd className="text-sm sm:text-base font-semibold text-nexa-ink mt-0.5">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
