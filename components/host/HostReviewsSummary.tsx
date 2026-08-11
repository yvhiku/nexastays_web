"use client";

import React from "react";
import { Star } from "lucide-react";
import type { HostReviewSummary } from "@/lib/stays-types";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";
import { distributionPctAsPercent } from "@/lib/host-reviews";

type TranslateFn = (key: string) => string;

const STAR_KEYS = ["5", "4", "3", "2", "1"] as const;

interface HostReviewsSummaryProps {
  summary: HostReviewSummary;
  t: TranslateFn;
  loading?: boolean;
}

export function HostReviewsSummary({
  summary,
  t,
  loading,
}: HostReviewsSummaryProps) {
  if (loading) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-40 bg-nexa-bg-2 rounded mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-24 bg-nexa-bg-2 rounded-xl" />
          <div className="h-24 bg-nexa-bg-2 rounded-xl" />
        </div>
      </section>
    );
  }

  const avg = summary.overall_avg_rating;
  const count = summary.total_count;

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8"
      aria-labelledby="host-reviews-summary-heading"
    >
      <h2
        id="host-reviews-summary-heading"
        className="text-lg font-semibold text-nexa-ink mb-1"
      >
        {t("hostReviews.summaryTitle")}
      </h2>
      <p className="text-sm text-nexa-ink-3 mb-5">{t("hostReviews.summaryDesc")}</p>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-nexa-ink-3 mb-2">{t("hostReviews.averageRating")}</p>
          {avg == null || count === 0 ? (
            <p className="text-sm text-nexa-ink-3">{t("hostReviews.noRatingYet")}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-3xl font-bold text-nexa-ink tabular-nums">
                {avg.toFixed(1)}
              </p>
              <StarRatingDisplay rating={avg} size="md" />
            </div>
          )}
          <p className="mt-2 text-sm text-nexa-ink-4">
            {t("hostReviews.reviewCount").replace("{count}", String(count))}
          </p>
        </div>

        <div>
          <p className="text-xs text-nexa-ink-3 mb-3">
            {t("hostReviews.ratingDistribution")}
          </p>
          <div className="space-y-2" aria-label={t("hostReviews.ratingDistribution")}>
            {STAR_KEYS.map((star) => {
              const fraction = summary.distribution_pct[star] ?? 0;
              const pct = distributionPctAsPercent(fraction);
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-12 shrink-0 text-nexa-ink-3 tabular-nums inline-flex items-center gap-1">
                    {star}
                    <Star
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-nexa-bg-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-end text-nexa-ink-4 tabular-nums text-xs">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
