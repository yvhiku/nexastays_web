import React from "react";
import type { SeoLandingQuickFacts } from "@/lib/seo/types";
import { formatStarRating } from "@/components/seo/landing/utils";

type Props = {
  title: string;
  facts: SeoLandingQuickFacts;
  labels: Record<string, string>;
};

export function SeoLandingProfile({ title, facts, labels }: Props) {
  const rows: { label: string; value: string }[] = [];
  if (facts.atmosphere) rows.push({ label: labels.atmosphere, value: facts.atmosphere });
  if (facts.budget) rows.push({ label: labels.budget, value: facts.budget });
  if (facts.family != null) rows.push({ label: labels.families, value: formatStarRating(facts.family) });
  if (facts.nightlife != null) rows.push({ label: labels.nightlife, value: formatStarRating(facts.nightlife) });
  if (facts.shopping != null) rows.push({ label: labels.shopping, value: formatStarRating(facts.shopping) });
  if (facts.walkability != null) rows.push({ label: labels.walkability, value: formatStarRating(facts.walkability) });
  if (facts.digital_nomads != null)
    rows.push({ label: labels.remoteWork, value: formatStarRating(facts.digital_nomads) });
  if (facts.culture != null) rows.push({ label: labels.culture, value: formatStarRating(facts.culture) });
  if (facts.luxury != null) rows.push({ label: labels.luxury, value: formatStarRating(facts.luxury) });

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
