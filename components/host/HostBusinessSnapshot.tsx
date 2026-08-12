"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Star,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import type { HostDashboardAggregate } from "@/lib/stays-types";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";

type TranslateFn = (key: string) => string;

interface HostBusinessSnapshotProps {
  dashboard: HostDashboardAggregate | null;
  loading?: boolean;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
}

export function HostBusinessSnapshot({
  dashboard,
  loading,
  t,
  locale,
  localePath,
}: HostBusinessSnapshotProps) {
  if (loading && !dashboard) {
    return (
      <section
        className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-40 bg-nexa-bg-2 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-nexa-bg-2 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (!dashboard) return null;

  const { inventory, reviews, earnings, currency } = dashboard;
  const occupancy = inventory.occupancy_pct_this_month;
  const basis = inventory.occupancy_basis;

  return (
    <section
      className="mb-6 rounded-2xl border border-nexa-line bg-white p-6 sm:p-8"
      aria-labelledby="host-snapshot-heading"
    >
      <h2
        id="host-snapshot-heading"
        className="text-lg font-semibold text-nexa-ink mb-1"
      >
        {t("hostDashboard.businessSnapshotTitle")}
      </h2>
      <p className="text-sm text-nexa-ink-3 mb-5">
        {t("hostDashboard.businessSnapshotDesc")}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="min-w-0 rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-nexa-ink-3">
            <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 text-xs leading-tight">
              {t("hostDashboard.occupancyThisMonth")}
            </span>
          </div>
          <p className="text-2xl font-bold text-nexa-ink tabular-nums">
            {occupancy.toFixed(1)}%
          </p>
          <p
            className="mt-2 text-[11px] leading-snug text-nexa-ink-4"
            title={basis}
          >
            {t("hostDashboard.occupancyBasisFootnote")}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-nexa-ink-3">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 text-xs leading-tight">
              {t("hostDashboard.liveListings")}
            </span>
          </div>
          <p className="text-2xl font-bold text-nexa-ink tabular-nums">
            {inventory.live_listings}
          </p>
          <p className="mt-2 text-[11px] text-nexa-ink-4">
            {t("hostDashboard.listingsCountLine")
              .replace("{pending}", String(inventory.pending_listings))
              .replace("{total}", String(inventory.total_listings))}
          </p>
        </div>

        <div className="min-w-0 rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-nexa-ink-3">
            <Star className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 text-xs leading-tight">
              {t("hostDashboard.avgRating")}
            </span>
          </div>
          {reviews.avg_rating == null ? (
            <p className="mt-1 text-sm text-nexa-ink-3">
              {t("hostDashboard.noReviewsYet")}
            </p>
          ) : (
            <>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-2xl font-bold text-nexa-ink tabular-nums">
                  {reviews.avg_rating.toFixed(1)}
                </p>
                <StarRatingDisplay rating={reviews.avg_rating} size="sm" />
              </div>
              <p className="mt-2 text-[11px] text-nexa-ink-4">
                {t("hostDashboard.reviewCount").replace(
                  "{count}",
                  String(reviews.total_reviews),
                )}
              </p>
            </>
          )}
          <Link
            href={localePath("/host/reviews")}
            className="mt-3 inline-flex text-xs font-medium text-nexa-primary hover:underline"
          >
            {t("hostReviews.viewReviews")}
          </Link>
        </div>

        <div className="min-w-0 rounded-xl border border-nexa-line bg-nexa-bg-1 p-4">
          <div className="mb-2 flex items-center gap-2 text-nexa-ink-3">
            <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 text-xs leading-tight">
              {t("hostDashboard.upcomingRevenue")}
            </span>
          </div>
          <p className="text-lg font-bold leading-tight text-nexa-ink tabular-nums break-words">
            {formatHostCurrency(
              earnings.upcoming_revenue_30d,
              currency,
              locale,
            )}
          </p>
          <p className="mt-2 text-[11px] text-nexa-ink-4">
            {t("hostDashboard.upcomingRevenueHint")}
          </p>
          <Link
            href={localePath("/host/analytics")}
            className="mt-3 inline-flex text-xs font-medium text-nexa-primary hover:underline"
          >
            {t("hostAnalytics.viewAnalytics")}
          </Link>
        </div>
      </div>

      {(dashboard.listing_health.missing?.length ?? 0) > 0 ? (
        <div className="mt-5 rounded-xl border border-nexa-line px-4 py-3">
          <p className="text-sm font-medium text-nexa-ink mb-1">
            {t("hostDashboard.listingHealth")}
          </p>
          <p className="text-xs text-nexa-ink-4 mb-2">
            {t("hostDashboard.healthCompletePct").replace(
              "{pct}",
              String(dashboard.listing_health.avg_completion_pct),
            )}
          </p>
          <ul className="text-sm text-nexa-ink-3 space-y-1">
            {dashboard.listing_health.missing.slice(0, 4).map((m) => (
              <li key={m.code}>• {m.label}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
