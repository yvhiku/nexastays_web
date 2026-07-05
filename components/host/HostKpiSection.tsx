"use client";

import React from "react";
import {
  TrendingUp,
  CalendarCheck,
  Clock,
  Building2,
  Star,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostDashboardStats } from "@/lib/stays-types";
import { formatHostCurrency } from "@/lib/host-dashboard-stats";

type TranslateFn = (key: string) => string;

interface HostKpiSectionProps {
  stats: HostDashboardStats;
  t: TranslateFn;
  loading?: boolean;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-nexa-line bg-white p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-nexa-ink-3">{label}</span>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-nexa-primary-soft text-nexa-primary shrink-0">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-nexa-ink tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-nexa-ink-4">{sub}</p> : null}
    </div>
  );
}

export function HostKpiSection({ stats, t, loading }: HostKpiSectionProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-nexa-line bg-white p-8 mb-8 text-center text-nexa-ink-4 text-sm">
        {t("hostDashboard.loadingKpis")}
      </div>
    );
  }

  const ratingLabel =
    stats.avg_rating != null
      ? stats.avg_rating.toFixed(1)
      : t("hostDashboard.noRatingYet");

  const ratingSub =
    stats.total_reviews > 0
      ? t("hostDashboard.reviewCount").replace("{count}", String(stats.total_reviews))
      : t("hostDashboard.noReviewsYet");

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-nexa-ink mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-nexa-primary" />
        {t("hostDashboard.kpisTitle")}
      </h2>

      {/* Earnings hero */}
      <div className="rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-nexa-ink via-[#2A2A4A] to-nexa-ink text-white p-6 sm:p-8 shadow-lg relative">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-nexa-primary/15 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-sm font-medium text-white/70">
              {t("hostDashboard.totalEarnings")}
            </p>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              {t("hostDashboard.allTime")}
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
            {formatHostCurrency(stats.total_earnings, stats.currency)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60 mb-1">{t("hostDashboard.thisMonth")}</p>
              <p className="text-lg font-semibold">
                {formatHostCurrency(stats.this_month_earnings, stats.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">{t("hostDashboard.totalBookings")}</p>
              <p className="text-lg font-semibold">{stats.total_bookings}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">{t("hostDashboard.completedBookings")}</p>
              <p className="text-lg font-semibold">{stats.completed_bookings}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">{t("hostDashboard.totalListings")}</p>
              <p className="text-lg font-semibold">{stats.total_listings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={t("hostDashboard.activeBookings")}
          value={String(stats.active_bookings)}
          sub={t("hostDashboard.activeBookingsHint")}
          icon={CalendarCheck}
        />
        <KpiCard
          label={t("hostDashboard.pendingBookings")}
          value={String(stats.pending_bookings)}
          sub={t("hostDashboard.pendingBookingsHint")}
          icon={Clock}
        />
        <KpiCard
          label={t("hostDashboard.liveListings")}
          value={String(stats.live_listings)}
          sub={
            stats.pending_listings > 0
              ? t("hostDashboard.pendingListingsCount").replace(
                  "{count}",
                  String(stats.pending_listings)
                )
              : undefined
          }
          icon={Building2}
        />
        <KpiCard
          label={t("hostDashboard.avgRating")}
          value={ratingLabel}
          sub={ratingSub}
          icon={Star}
        />
      </div>
    </section>
  );
}
