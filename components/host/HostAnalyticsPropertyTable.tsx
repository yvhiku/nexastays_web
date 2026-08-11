"use client";

import React from "react";
import Link from "next/link";
import type { HostAnalyticsProperty } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import { formatOccupancyDisplay } from "@/lib/host-analytics";

type TranslateFn = (key: string) => string;

interface HostAnalyticsPropertyTableProps {
  properties: HostAnalyticsProperty[];
  currency: string;
  locale: Locale;
  localePath: (path: string) => string;
  t: TranslateFn;
}

export function HostAnalyticsPropertyTable({
  properties,
  currency,
  locale,
  localePath,
  t,
}: HostAnalyticsPropertyTableProps) {
  return (
    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-nexa-line bg-white">
      <table className="w-full min-w-[56rem] text-sm text-start">
        <thead>
          <tr className="border-b border-nexa-line bg-nexa-bg-1 text-xs text-nexa-ink-3 uppercase tracking-wide">
            <th className="px-4 py-3 font-medium text-start">
              {t("hostAnalytics.colProperty")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colBookings")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colNights")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colNet")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colGross")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colOccupancy")}
            </th>
            <th className="px-3 py-3 font-medium text-end">
              {t("hostAnalytics.colRating")}
            </th>
            <th className="px-4 py-3 font-medium text-start">
              {t("hostAnalytics.colHealth")}
            </th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr
              key={p.listing_id}
              className="border-b border-nexa-line last:border-0 align-top"
            >
              <td className="px-4 py-3">
                <Link
                  href={localePath(`/host/listings/${p.listing_id}/edit`)}
                  className="font-medium text-nexa-ink hover:text-nexa-primary"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-nexa-ink-4 mt-0.5">
                  {p.city} · {p.status}
                </p>
              </td>
              <td className="px-3 py-3 text-end tabular-nums">
                {p.bookings.total}
                <p className="text-[11px] text-nexa-ink-4">
                  {t("hostAnalytics.bookingsBreakdown")
                    .replace("{upcoming}", String(p.bookings.upcoming))
                    .replace("{current}", String(p.bookings.current))
                    .replace("{pending}", String(p.bookings.payment_pending))}
                </p>
              </td>
              <td className="px-3 py-3 text-end tabular-nums">
                {p.nights.booked_in_period}
              </td>
              <td className="px-3 py-3 text-end tabular-nums font-semibold">
                {formatHostCurrency(
                  p.earnings.net_host_earnings,
                  currency,
                  locale,
                )}
              </td>
              <td className="px-3 py-3 text-end tabular-nums">
                {formatHostCurrency(p.earnings.gross_revenue, currency, locale)}
              </td>
              <td className="px-3 py-3 text-end tabular-nums">
                {formatOccupancyDisplay(
                  p.occupancy.value,
                  t("hostAnalytics.occupancyUnavailable"),
                )}
              </td>
              <td className="px-3 py-3 text-end tabular-nums">
                {p.reviews.avg_rating != null
                  ? `${p.reviews.avg_rating.toFixed(1)} (${p.reviews.total_reviews})`
                  : `— (${p.reviews.total_reviews})`}
              </td>
              <td className="px-4 py-3 text-xs text-nexa-ink-3">
                <p>
                  {p.health.completion_percentage}% · {p.health.calendar_status}
                </p>
                {p.health.attention.length > 0 ? (
                  <p className="text-amber-800 mt-0.5">
                    {p.health.attention.join(", ")}
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
