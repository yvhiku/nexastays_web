"use client";

import React from "react";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CalendarDays,
  Star,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import type { HostDashboardAggregate } from "@/lib/stays-types";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";
import type { Locale } from "@/lib/i18n";
import { HostPortalStatCard } from "@/components/host/portal/HostPortalStatCard";

type TranslateFn = (key: string) => string;

type Props = {
  dashboard: HostDashboardAggregate | null;
  loading?: boolean;
  t: TranslateFn;
  locale: Locale;
  localePath: (path: string) => string;
};

export function HostDashboardKpiRow({
  dashboard,
  loading,
  t,
  locale,
  localePath,
}: Props) {
  if (loading && !dashboard) {
    return (
      <div
        className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="host-portal-card h-36 animate-pulse bg-[color:var(--host-surface)]"
          />
        ))}
      </div>
    );
  }

  if (!dashboard) return null;

  const net = dashboard.earnings.this_month.net_host_earnings;
  const mom = dashboard.earnings.this_month.mom_pct;
  const occupancy = dashboard.inventory.occupancy_pct_this_month;
  const active = dashboard.bookings_summary.active;
  const upcoming = dashboard.operations.upcoming_checkins;
  const rating = dashboard.reviews.avg_rating;
  const reviewCount = dashboard.reviews.total_reviews;
  const currency = dashboard.currency;

  let momNode: React.ReactNode = (
    <span className="text-[color:var(--host-text-secondary)]">
      {t("hostDashboard.momUnavailable")}
    </span>
  );
  if (mom != null && !Number.isNaN(mom)) {
    if (mom === 0) {
      momNode = (
        <span className="inline-flex items-center gap-1 text-[color:var(--host-text-secondary)]">
          <Minus className="h-3.5 w-3.5" aria-hidden />
          {t("hostDashboard.momFlat")}
        </span>
      );
    } else if (mom > 0) {
      momNode = (
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          {t("hostDashboard.momUp").replace("{pct}", Math.abs(mom).toFixed(1))}
        </span>
      );
    } else {
      momNode = (
        <span className="inline-flex items-center gap-1 text-red-700">
          <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          {t("hostDashboard.momDown").replace("{pct}", Math.abs(mom).toFixed(1))}
        </span>
      );
    }
  }

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <HostPortalStatCard
        label={t("hostPortal.dashboard.kpiRevenue")}
        value={formatHostCurrency(net, currency, locale)}
        icon={Banknote}
        trend={momNode}
        supportingText={t("hostDashboard.netEarningsLabel")}
      />
      <HostPortalStatCard
        label={t("hostPortal.dashboard.kpiOccupancy")}
        value={`${occupancy.toFixed(1)}%`}
        icon={Building2}
        supportingText={t("hostDashboard.occupancyBasisFootnote")}
      />
      <Link
        href={localePath("/host/bookings")}
        className="block rounded-[var(--host-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--host-primary)]"
      >
        <HostPortalStatCard
          label={t("hostPortal.dashboard.kpiReservations")}
          value={String(active)}
          icon={CalendarDays}
          supportingText={t("hostPortal.dashboard.kpiReservationsHint")
            .replace("{active}", String(active))
            .replace("{upcoming}", String(upcoming))}
          className="h-full transition-shadow hover:shadow-[var(--host-shadow-hover)]"
        />
      </Link>
      <Link
        href={localePath("/host/reviews")}
        className="block rounded-[var(--host-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--host-primary)]"
      >
        <HostPortalStatCard
          label={t("hostPortal.dashboard.kpiRating")}
          value={
            rating != null ? (
              <>
                {rating.toFixed(1)}
                <span className="ms-1 text-lg font-medium text-[color:var(--host-text-secondary)]">
                  /5
                </span>
              </>
            ) : (
              t("hostPortal.dashboard.kpiRatingEmpty")
            )
          }
          icon={Star}
          supportingText={
            reviewCount > 0
              ? t("hostDashboard.reviewCount").replace(
                  "{count}",
                  String(reviewCount),
                )
              : t("hostPortal.dashboard.kpiRatingHintEmpty")
          }
          className="h-full transition-shadow hover:shadow-[var(--host-shadow-hover)]"
        />
      </Link>
    </div>
  );
}
