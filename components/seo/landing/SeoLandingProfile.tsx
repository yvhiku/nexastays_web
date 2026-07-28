import React from "react";
import type { SeoLandingQuickFacts } from "@/lib/seo/types";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";

type Props = {
  title: string;
  facts: SeoLandingQuickFacts;
  labels: Record<string, string>;
};

export function SeoLandingProfile({ title, facts, labels }: Props) {
  const rows: { label: string; value: React.ReactNode }[] = [];
  if (facts.atmosphere) rows.push({ label: labels.atmosphere, value: facts.atmosphere });
  if (facts.budget) rows.push({ label: labels.budget, value: facts.budget });
  if (facts.family != null) {
    rows.push({ label: labels.families, value: <StarRatingDisplay rating={facts.family} /> });
  }
  if (facts.nightlife != null) {
    rows.push({ label: labels.nightlife, value: <StarRatingDisplay rating={facts.nightlife} /> });
  }
  if (facts.shopping != null) {
    rows.push({ label: labels.shopping, value: <StarRatingDisplay rating={facts.shopping} /> });
  }
  if (facts.walkability != null) {
    rows.push({ label: labels.walkability, value: <StarRatingDisplay rating={facts.walkability} /> });
  }
  if (facts.digital_nomads != null) {
    rows.push({ label: labels.remoteWork, value: <StarRatingDisplay rating={facts.digital_nomads} /> });
  }
  if (facts.culture != null) {
    rows.push({ label: labels.culture, value: <StarRatingDisplay rating={facts.culture} /> });
  }
  if (facts.luxury != null) {
    rows.push({ label: labels.luxury, value: <StarRatingDisplay rating={facts.luxury} /> });
  }

  if (rows.length === 0) return null;

  return (
    <section className="rounded-[22px] border border-nexa-border/80 bg-nexa-surface p-6 sm:p-8">
      <h2 className="font-display text-lg sm:text-xl font-semibold text-nexa-ink mb-5">{title}</h2>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
