"use client";

import React from "react";
import Link from "next/link";
import type { HostAnalyticsProperty } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import { formatOccupancyDisplay } from "@/lib/host-analytics";
import { StarRatingDisplay } from "@/components/ui/StarRatingDisplay";

type TranslateFn = (key: string) => string;

interface HostAnalyticsPropertyCardProps {
  property: HostAnalyticsProperty;
  currency: string;
  locale: Locale;
  localePath: (path: string) => string;
  t: TranslateFn;
}

export function HostAnalyticsPropertyCard({
  property: p,
  currency,
  locale,
  localePath,
  t,
}: HostAnalyticsPropertyCardProps) {
  const occupancyLabel = formatOccupancyDisplay(
    p.occupancy.value,
    t("hostAnalytics.occupancyUnavailable"),
  );

  return (
    <article className="rounded-2xl border border-nexa-line bg-white p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-nexa-ink text-base">{p.title}</h3>
        <p className="text-xs text-nexa-ink-4 mt-0.5">
          {p.city} · {p.status}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.netEarnings")}</dt>
          <dd className="font-semibold text-nexa-ink tabular-nums mt-0.5">
            {formatHostCurrency(p.earnings.net_host_earnings, currency, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.grossRevenue")}</dt>
          <dd className="font-medium text-nexa-ink tabular-nums mt-0.5">
            {formatHostCurrency(p.earnings.gross_revenue, currency, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.bookingsTotal")}</dt>
          <dd className="tabular-nums mt-0.5">{p.bookings.total}</dd>
        </div>
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.bookedNights")}</dt>
          <dd className="tabular-nums mt-0.5">{p.nights.booked_in_period}</dd>
        </div>
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.occupancy")}</dt>
          <dd className="tabular-nums mt-0.5">{occupancyLabel}</dd>
        </div>
        <div>
          <dt className="text-nexa-ink-4 text-xs">{t("hostAnalytics.rating")}</dt>
          <dd className="mt-0.5 flex items-center gap-1.5">
            {p.reviews.avg_rating != null ? (
              <>
                <span className="tabular-nums font-medium">
                  {p.reviews.avg_rating.toFixed(1)}
                </span>
                <StarRatingDisplay rating={p.reviews.avg_rating} size="sm" />
              </>
            ) : (
              <span className="text-nexa-ink-4">{t("hostAnalytics.noRating")}</span>
            )}
            <span className="text-xs text-nexa-ink-4">
              ({p.reviews.total_reviews})
            </span>
          </dd>
        </div>
      </dl>

      <div className="pt-3 border-t border-nexa-line text-xs text-nexa-ink-3 space-y-1">
        <p>
          {t("hostAnalytics.platformFees")}:{" "}
          <span className="tabular-nums text-nexa-ink">
            {formatHostCurrency(p.earnings.platform_fees, currency, locale)}
          </span>
        </p>
        <p>
          {t("hostAnalytics.payoutPending")}:{" "}
          <span className="tabular-nums text-nexa-ink">
            {formatHostCurrency(p.payouts.pending, currency, locale)}
          </span>
          {" · "}
          {t("hostAnalytics.payoutPaidOut")}:{" "}
          <span className="tabular-nums text-nexa-ink">
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

      <div className="flex flex-wrap gap-3 pt-1">
        <Link
          href={localePath(`/host/listings/${p.listing_id}/edit`)}
          className="text-xs font-medium text-nexa-primary hover:underline"
        >
          {t("hostAnalytics.editListing")}
        </Link>
        <Link
          href={localePath("/host/reviews")}
          className="text-xs font-medium text-nexa-primary hover:underline"
        >
          {t("hostAnalytics.viewReviews")}
        </Link>
      </div>
    </article>
  );
}
