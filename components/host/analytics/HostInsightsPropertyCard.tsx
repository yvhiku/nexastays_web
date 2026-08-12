"use client";

import React from "react";
import Link from "next/link";
import type { HostAnalyticsProperty } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import { formatOccupancyDisplay } from "@/lib/host-analytics";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { HostPortalStatusBadge } from "@/components/host/portal/HostPortalStatusBadge";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";

type TranslateFn = (key: string) => string;

type Props = {
  property: HostAnalyticsProperty;
  currency: string;
  locale: Locale;
  localePath: (path: string) => string;
  t: TranslateFn;
};

export function HostInsightsPropertyCard({
  property: p,
  currency,
  locale,
  localePath,
  t,
}: Props) {
  const occupancyLabel = formatOccupancyDisplay(
    p.occupancy.value,
    t("hostAnalytics.occupancyUnavailable"),
  );

  return (
    <HostPortalCard className="p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-[color:var(--host-text)]">
            {p.title}
          </h3>
          <p className="mt-0.5 text-sm text-[color:var(--host-text-secondary)]">
            {p.city}
          </p>
        </div>
        <HostPortalStatusBadge tone="neutral">{p.status}</HostPortalStatusBadge>
      </div>

      <dl className="space-y-2.5 text-sm">
        <div className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 text-xs text-[color:var(--host-muted)]">
              {t("hostAnalytics.bookingsTotal")}
            </dt>
            <dd className="shrink-0 text-end tabular-nums text-[color:var(--host-text)]">
              {p.bookings.total}
            </dd>
          </div>
          <p className="text-[11px] text-[color:var(--host-muted)]">
            {t("hostAnalytics.bookingsBreakdown")
              .replace("{upcoming}", String(p.bookings.upcoming))
              .replace("{current}", String(p.bookings.current))
              .replace("{pending}", String(p.bookings.payment_pending))}
          </p>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.bookedNights")}
          </dt>
          <dd className="shrink-0 text-end tabular-nums text-[color:var(--host-text)]">
            {p.nights.booked_in_period}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.netEarnings")}
          </dt>
          <dd className="shrink-0 text-end font-semibold tabular-nums text-[color:var(--host-text)]">
            {formatHostCurrency(p.earnings.net_host_earnings, currency, locale)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.grossRevenue")}
          </dt>
          <dd className="shrink-0 text-end font-medium tabular-nums text-[color:var(--host-text)]">
            {formatHostCurrency(p.earnings.gross_revenue, currency, locale)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.occupancy")}
          </dt>
          <dd className="shrink-0 text-end tabular-nums text-[color:var(--host-text)]">
            {occupancyLabel}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="min-w-0 pt-0.5 text-xs text-[color:var(--host-muted)]">
            {t("hostAnalytics.rating")}
          </dt>
          <dd className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {p.reviews.avg_rating != null ? (
              <>
                <span className="font-medium tabular-nums">
                  {p.reviews.avg_rating.toFixed(1)}
                </span>
                <StarRatingDisplay rating={p.reviews.avg_rating} size="sm" />
              </>
            ) : (
              <span className="text-[color:var(--host-muted)]">
                {t("hostAnalytics.noRating")}
              </span>
            )}
            <span className="text-xs text-[color:var(--host-muted)]">
              ({p.reviews.total_reviews})
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-1 border-t border-[color:var(--host-border)] pt-3 text-xs text-[color:var(--host-text-secondary)]">
        <p>
          {t("hostAnalytics.platformFees")}:{" "}
          <span className="tabular-nums text-[color:var(--host-text)]">
            {formatHostCurrency(p.earnings.platform_fees, currency, locale)}
          </span>
        </p>
        <p>
          {t("hostAnalytics.payoutPending")}:{" "}
          <span className="tabular-nums text-[color:var(--host-text)]">
            {formatHostCurrency(p.payouts.pending, currency, locale)}
          </span>
          {" · "}
          {t("hostAnalytics.payoutPaidOut")}:{" "}
          <span className="tabular-nums text-[color:var(--host-text)]">
            {formatHostCurrency(p.payouts.paid_out, currency, locale)}
          </span>
        </p>
        <p>
          {t("hostAnalytics.opsLine")
            .replace("{staying}", String(p.operations.currently_staying))
            .replace("{upcoming}", String(p.operations.upcoming_bookings))
            .replace("{pending}", String(p.bookings.payment_pending))}
        </p>
        <p>
          {t("hostAnalytics.healthLine")
            .replace("{pct}", String(p.health.completion_percentage))
            .replace("{calendar}", p.health.calendar_status)}
        </p>
        {p.health.attention.length > 0 ? (
          <p className="text-amber-800">
            {t("hostAnalytics.attention")}: {p.health.attention.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={localePath(`/host/listings/${p.listing_id}/edit`)}
          className="text-xs font-medium text-[color:var(--host-primary)] underline-offset-2 hover:underline"
        >
          {t("hostAnalytics.editListing")}
        </Link>
        <Link
          href={localePath("/host/reviews")}
          className="text-xs font-medium text-[color:var(--host-primary)] underline-offset-2 hover:underline"
        >
          {t("hostAnalytics.viewReviews")}
        </Link>
      </div>
    </HostPortalCard>
  );
}
