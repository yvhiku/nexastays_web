"use client";

import React from "react";
import { Star } from "lucide-react";
import type { HostReviewSummary } from "@/lib/stays-types";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";
import { distributionPctAsPercent } from "@/lib/host-reviews";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { HostPortalStatCard } from "@/components/host/portal/HostPortalStatCard";

type TranslateFn = (key: string) => string;

const STAR_KEYS = ["5", "4", "3", "2", "1"] as const;

type Props = {
  summary: HostReviewSummary;
  t: TranslateFn;
  loading?: boolean;
};

/**
 * Summary from API HostReviewSummary only — do not recompute from page rows.
 */
export function HostReviewsSummary({ summary, t, loading }: Props) {
  if (loading) {
    return (
      <section className="mb-6 animate-pulse" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2">
          <HostPortalCard className="h-28">
            <span className="sr-only">Loading</span>
          </HostPortalCard>
          <HostPortalCard className="h-28">
            <span className="sr-only">Loading</span>
          </HostPortalCard>
        </div>
      </section>
    );
  }

  const avg = summary.overall_avg_rating;
  const count = summary.total_count;

  return (
    <section className="mb-6" aria-labelledby="host-reviews-summary-heading">
      <div className="mb-4">
        <h2
          id="host-reviews-summary-heading"
          className="text-lg font-semibold text-[color:var(--host-text)]"
        >
          {t("hostReviews.summaryTitle")}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
          {t("hostReviews.summaryDesc")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HostPortalStatCard
          label={t("hostReviews.averageRating")}
          value={
            avg == null || count === 0 ? (
              <span className="text-base font-medium text-[color:var(--host-text-secondary)]">
                {t("hostReviews.noRatingYet")}
              </span>
            ) : (
              <span className="inline-flex flex-wrap items-center gap-3">
                <span className="tabular-nums">{avg.toFixed(1)}</span>
                <StarRatingDisplay rating={avg} size="md" />
              </span>
            )
          }
          supportingText={t("hostReviews.reviewCount").replace(
            "{count}",
            String(count),
          )}
          icon={Star}
        />

        <HostPortalCard className="p-6">
          <p className="mb-3 text-sm font-medium text-[color:var(--host-text-secondary)]">
            {t("hostReviews.ratingDistribution")}
          </p>
          <div
            className="space-y-2"
            aria-label={t("hostReviews.ratingDistribution")}
          >
            {STAR_KEYS.map((star) => {
              const fraction = summary.distribution_pct[star] ?? 0;
              const pct = distributionPctAsPercent(fraction);
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="inline-flex w-12 shrink-0 items-center gap-1 tabular-nums text-[color:var(--host-muted)]">
                    {star}
                    <Star
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--host-primary-soft)]">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{
                        width: `${Math.min(100, Math.max(0, pct))}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-end text-xs tabular-nums text-[color:var(--host-muted)]">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </HostPortalCard>
      </div>
    </section>
  );
}
