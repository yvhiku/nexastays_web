"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { HostAnalyticsProperty } from "@/lib/stays-types";
import type { Locale } from "@/lib/i18n";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import {
  formatOccupancyDisplay,
  HOST_INSIGHTS_PROPERTY_SORT_ORDER,
  sortHostInsightsProperties,
  type HostInsightsPropertySortId,
} from "@/lib/host-analytics";
import { HostPortalCard } from "@/components/host/portal/HostPortalCard";
import { HostPortalSortSelect } from "@/components/host/portal/HostPortalSortSelect";
import { HostInsightsPropertyCard } from "@/components/host/analytics/HostInsightsPropertyCard";

type TranslateFn = (key: string) => string;

type Props = {
  properties: HostAnalyticsProperty[];
  currency: string;
  locale: Locale;
  localePath: (path: string) => string;
  t: TranslateFn;
};

const SORT_LABEL_KEYS: Record<HostInsightsPropertySortId, string> = {
  default: "hostPortal.analytics.sortDefault",
  title: "hostPortal.analytics.sortTitle",
  bookings: "hostPortal.analytics.sortBookings",
  net: "hostPortal.analytics.sortNet",
  occupancy: "hostPortal.analytics.sortOccupancy",
  rating: "hostPortal.analytics.sortRating",
};

/** Property insights list with optional client sort (index-stable ties). */
export function HostInsightsProperties({
  properties,
  currency,
  locale,
  localePath,
  t,
}: Props) {
  const [sort, setSort] = useState<HostInsightsPropertySortId>("default");
  const sorted = useMemo(
    () => sortHostInsightsProperties(properties, sort),
    [properties, sort],
  );

  return (
    <section className="mb-8" aria-labelledby="host-insights-properties-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="host-insights-properties-heading"
            className="text-lg font-semibold text-[color:var(--host-text)]"
          >
            {t("hostAnalytics.propertiesTitle")}
          </h2>
          <Link
            href={localePath("/host/reviews")}
            className="mt-1 inline-block text-sm font-medium text-[color:var(--host-primary)] underline-offset-2 hover:underline"
          >
            {t("hostAnalytics.viewReviews")}
          </Link>
        </div>
        <HostPortalSortSelect
          className="w-full max-w-xs sm:w-56"
          label={t("hostPortal.sortBy")}
          value={sort}
          onChange={(v) => setSort(v as HostInsightsPropertySortId)}
          options={HOST_INSIGHTS_PROPERTY_SORT_ORDER.map((id) => ({
            value: id,
            label: t(SORT_LABEL_KEYS[id]),
          }))}
        />
      </div>

      <HostPortalCard className="mb-4 hidden overflow-x-auto p-0 lg:block">
        <table className="w-full min-w-[56rem] text-start text-sm">
          <thead>
            <tr className="border-b border-[color:var(--host-border)] bg-[color:var(--host-background)] text-xs uppercase tracking-wide text-[color:var(--host-muted)]">
              <th className="px-4 py-3 text-start font-medium">
                {t("hostAnalytics.colProperty")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colBookings")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colNights")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colNet")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colGross")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colOccupancy")}
              </th>
              <th className="px-3 py-3 text-end font-medium">
                {t("hostAnalytics.colRating")}
              </th>
              <th className="px-4 py-3 text-start font-medium">
                {t("hostAnalytics.colHealth")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr
                key={p.listing_id}
                className="border-b border-[color:var(--host-border)] align-top last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={localePath(`/host/listings/${p.listing_id}/edit`)}
                    className="font-medium text-[color:var(--host-text)] hover:text-[color:var(--host-primary)]"
                  >
                    {p.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-[color:var(--host-muted)]">
                    {p.city} · {p.status}
                  </p>
                </td>
                <td className="px-3 py-3 text-end tabular-nums">
                  {p.bookings.total}
                  <p className="text-[11px] text-[color:var(--host-muted)]">
                    {t("hostAnalytics.bookingsBreakdown")
                      .replace("{upcoming}", String(p.bookings.upcoming))
                      .replace("{current}", String(p.bookings.current))
                      .replace("{pending}", String(p.bookings.payment_pending))}
                  </p>
                </td>
                <td className="px-3 py-3 text-end tabular-nums">
                  {p.nights.booked_in_period}
                </td>
                <td className="px-3 py-3 text-end font-semibold tabular-nums">
                  {formatHostCurrency(
                    p.earnings.net_host_earnings,
                    currency,
                    locale,
                  )}
                </td>
                <td className="px-3 py-3 text-end tabular-nums">
                  {formatHostCurrency(
                    p.earnings.gross_revenue,
                    currency,
                    locale,
                  )}
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
                <td className="px-4 py-3 text-xs text-[color:var(--host-text-secondary)]">
                  <p>
                    {p.health.completion_percentage}% ·{" "}
                    {p.health.calendar_status}
                  </p>
                  {p.health.attention.length > 0 ? (
                    <p className="mt-0.5 text-amber-800">
                      {p.health.attention.join(", ")}
                    </p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </HostPortalCard>

      <ul className="space-y-4 lg:hidden">
        {sorted.map((p) => (
          <li key={p.listing_id}>
            <HostInsightsPropertyCard
              property={p}
              currency={currency}
              locale={locale}
              localePath={localePath}
              t={t}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
