"use client";

import React from "react";
import Link from "next/link";
import type { HostReview } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { HostReviewCard } from "@/components/host/reviews/HostReviewCard";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { Button } from "@/components/ui/button";

type TranslateFn = (key: string) => string;

type Props = {
  reviews: HostReview[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
};

/**
 * Real recent reviews (incl. guest photos) for Home — not invented metrics.
 * Error must not collapse into an empty/hidden section (P7-STATES).
 */
export function HostDashboardRecentReviews({
  reviews,
  loading,
  error,
  onRetry,
  t,
  locale,
  localePath,
}: Props) {
  if (loading) {
    return (
      <section className="mb-8 animate-pulse" aria-busy="true">
        <div className="mb-4 h-6 w-40 rounded bg-[color:var(--host-primary-soft)]" />
        <HostPortalCard className="h-28">
          <span className="sr-only">{t("hostReviews.loading")}</span>
        </HostPortalCard>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8" aria-labelledby="host-dashboard-recent-reviews">
        <h2
          id="host-dashboard-recent-reviews"
          className="mb-3 text-lg font-semibold text-[color:var(--host-text)]"
        >
          {t("hostPortal.dashboard.recentReviewsTitle")}
        </h2>
        <HostPortalCard className="border-red-100 bg-red-50 px-4 py-5 text-sm text-red-900">
          <p>{error}</p>
          {onRetry ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              {t("hostReviews.retry")}
            </Button>
          ) : null}
        </HostPortalCard>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className="mb-8" aria-labelledby="host-dashboard-recent-reviews">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="host-dashboard-recent-reviews"
            className="text-lg font-semibold text-[color:var(--host-text)]"
          >
            {t("hostPortal.dashboard.recentReviewsTitle")}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--host-text-secondary)]">
            {t("hostPortal.dashboard.recentReviewsDesc")}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={localePath("/host/reviews")}>
            {t("hostReviews.viewReviews")}
          </Link>
        </Button>
      </div>
      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id}>
            <HostReviewCard review={review} locale={locale} t={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
