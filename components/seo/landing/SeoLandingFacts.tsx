import React from "react";
import type { DestinationIntelligence, SeoLandingKeyValue } from "@/lib/seo/types";

type Props = {
  title: string;
  intelligence: DestinationIntelligence;
  editorialFacts?: SeoLandingKeyValue[];
  labels: {
    avgPrice: string;
    topPropertyType: string;
    verifiedPercent: string;
    avgRating: string;
    listingCount: string;
    perNight: string;
  };
};

export function SeoLandingFacts({ title, intelligence, editorialFacts, labels }: Props) {
  const live: SeoLandingKeyValue[] = [];
  if (intelligence.avgNightlyPrice != null) {
    live.push({
      label: labels.avgPrice,
      value: `${intelligence.avgNightlyPrice} ${intelligence.currency}${labels.perNight}`,
    });
  }
  if (intelligence.topPropertyType) {
    live.push({ label: labels.topPropertyType, value: intelligence.topPropertyType });
  }
  if (intelligence.verifiedPercent != null) {
    live.push({ label: labels.verifiedPercent, value: `${intelligence.verifiedPercent}%` });
  }
  if (intelligence.avgRating != null) {
    live.push({ label: labels.avgRating, value: String(intelligence.avgRating) });
  }
  if (intelligence.listingCount > 0) {
    live.push({ label: labels.listingCount, value: String(intelligence.listingCount) });
  }

  const rows = [...live, ...(editorialFacts ?? [])];
  if (rows.length === 0) return null;

  return (
    <section className="rounded-[22px] border border-nexa-border/80 bg-nexa-bg/40 p-6 sm:p-8">
      <h2 className="font-display text-lg font-semibold text-nexa-ink mb-5">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-nexa-muted">{row.label}</dt>
            <dd className="text-sm font-semibold text-nexa-ink mt-0.5">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
