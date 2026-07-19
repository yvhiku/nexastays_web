"use client";

import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarCheck,
  Users,
  Star,
  BarChart3,
  ShieldCheck,
  Link2,
  Camera,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HostDashboardStats } from "@/lib/stays-types";
import {
  formatHostCurrency,
  formatMomBadge,
} from "@/lib/host-dashboard-stats";

type TranslateFn = (key: string) => string;

interface HostKpiSectionProps {
  stats: HostDashboardStats;
  t: TranslateFn;
  loading?: boolean;
}

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function relativeNextGuest(
  iso: string | null | undefined,
  t: TranslateFn,
): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return t("hostDashboard.relativeToday");
  if (diff === 1) return t("hostDashboard.relativeTomorrow");
  if (diff > 1 && diff < 7) {
    return t("hostDashboard.relativeInDays").replace("{days}", String(diff));
  }
  return iso;
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  onClick,
  title,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  title?: string;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-2xl border border-nexa-line bg-white p-5 flex flex-col gap-3 text-left w-full",
        onClick && "hover:border-nexa-primary/40 transition-colors cursor-pointer",
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
    </Comp>
  );
}

function RevenueSparkline({
  series,
  currency,
  t,
}: {
  series: Array<{ date: string; amount: number }>;
  currency: string;
  t: TranslateFn;
}) {
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const points = useMemo(() => {
    const slice = range === "7d" ? series.slice(-7) : series;
    const max = Math.max(...slice.map((p) => p.amount), 1);
    const w = 280;
    const h = 72;
    const pad = 4;
    return {
      slice,
      max,
      path: slice
        .map((p, i) => {
          const x =
            pad + (slice.length <= 1 ? 0 : (i / (slice.length - 1)) * (w - pad * 2));
          const y = h - pad - (p.amount / max) * (h - pad * 2);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
      w,
      h,
    };
  }, [series, range]);

  const total = points.slice.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="rounded-2xl border border-nexa-line bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-nexa-ink">
            {t("hostDashboard.revenueTrend")}
          </p>
          <p className="text-xs text-nexa-ink-4 mt-0.5">
            {formatHostCurrency(total, currency)} ·{" "}
            {range === "7d"
              ? t("hostDashboard.sparkline7d")
              : t("hostDashboard.sparkline30d")}
          </p>
        </div>
        <div className="flex rounded-full border border-nexa-line p-0.5 text-xs font-semibold">
          {(["7d", "30d"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={cn(
                "px-3 py-1.5 rounded-full transition-colors",
                range === key
                  ? "bg-nexa-primary text-white"
                  : "text-nexa-ink-3 hover:text-nexa-ink",
              )}
            >
              {key === "7d"
                ? t("hostDashboard.sparkline7d")
                : t("hostDashboard.sparkline30d")}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${points.w} ${points.h}`}
        className="w-full h-20 text-nexa-primary"
        role="img"
        aria-label={t("hostDashboard.revenueTrend")}
      >
        <path
          d={points.path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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

  const mom = formatMomBadge(stats.earnings_mom_pct, t);
  const MomIcon =
    mom.kind === "up" ? TrendingUp : mom.kind === "down" ? TrendingDown : Minus;

  const ratingLabel =
    stats.avg_rating != null
      ? `${stats.avg_rating.toFixed(2)}★`
      : t("hostDashboard.noRatingYet");
  const ratingSub =
    stats.total_reviews > 0
      ? t("hostDashboard.reviewCount").replace(
          "{count}",
          String(stats.total_reviews),
        )
      : t("hostDashboard.noReviewsYet");

  const nextRel = relativeNextGuest(stats.next_checkin_date, t);
  const upcomingSub =
    stats.next_guest_name || nextRel
      ? t("hostDashboard.nextGuestLine")
          .replace("{name}", stats.next_guest_name || t("hostDashboard.guest"))
          .replace("{when}", nextRel || "—")
      : t("hostDashboard.noUpcomingGuests");

  const occupancy = stats.occupancy_pct_this_month ?? 0;
  const health = stats.listing_health;
  const cal = stats.calendar_status ?? {
    healthy: true,
    listings_needing_attention: 0,
  };
  const series = stats.revenue_series_30d ?? [];
  const showPending =
    stats.pending_payout_amount != null && stats.pending_payout_amount > 0;

  return (
    <section className="mb-8 space-y-4">
      <h2 className="text-lg font-semibold text-nexa-ink flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-nexa-primary" />
        {t("hostDashboard.kpisTitle")}
      </h2>

      {/* Revenue hero — money dominant */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-nexa-ink via-[#2A2A4A] to-nexa-ink text-white p-6 sm:p-8 shadow-lg relative">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-nexa-primary/15 blur-2xl pointer-events-none" />
        <div className="relative">
          <p className="text-sm font-medium text-white/70 mb-1">
            {t("hostDashboard.totalEarnings")}
          </p>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {formatHostCurrency(stats.total_earnings, stats.currency)}
          </p>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-6",
              mom.kind === "down"
                ? "bg-white/10 text-amber-300"
                : "bg-white/10 text-emerald-400",
            )}
          >
            <MomIcon className="h-3.5 w-3.5" />
            {mom.label}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60 mb-1">
                {t("hostDashboard.thisMonth")}
              </p>
              <p className="text-lg font-semibold">
                {formatHostCurrency(stats.this_month_earnings, stats.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-1">
                {t("hostDashboard.occupancyThisMonth")}
              </p>
              <p className="text-lg font-semibold">{occupancy}%</p>
            </div>
            {showPending ? (
              <div>
                <p className="text-xs text-white/60 mb-1">
                  {t("hostDashboard.pendingPayout")}
                </p>
                <p className="text-lg font-semibold">
                  {formatHostCurrency(
                    stats.pending_payout_amount!,
                    stats.currency,
                  )}
                </p>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-white/60 mb-1">
                {t("hostDashboard.upcomingRevenue")}
              </p>
              <p className="text-lg font-semibold">
                {formatHostCurrency(
                  stats.upcoming_revenue_30d ?? 0,
                  stats.currency,
                )}
              </p>
              <p className="text-[10px] text-white/50 mt-0.5">
                {t("hostDashboard.upcomingRevenueHint")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Business KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={t("hostDashboard.upcomingGuests")}
          value={String(stats.upcoming_checkins ?? 0)}
          sub={upcomingSub}
          icon={CalendarCheck}
          onClick={() => scrollToId("host-bookings")}
        />
        <KpiCard
          label={t("hostDashboard.currentGuests")}
          value={String(stats.current_guests ?? 0)}
          sub={t("hostDashboard.currentlyStaying")}
          icon={Users}
          onClick={() => scrollToId("host-bookings")}
        />
        <KpiCard
          label={t("hostDashboard.avgNightlyEarnings")}
          value={
            stats.avg_nightly_earnings != null
              ? formatHostCurrency(stats.avg_nightly_earnings, stats.currency)
              : "—"
          }
          sub={t("hostDashboard.avgNightlyEarningsHint")}
          icon={TrendingUp}
          title={t("hostDashboard.adrTooltip")}
        />
        <KpiCard
          label={t("hostDashboard.avgRating")}
          value={ratingLabel}
          sub={ratingSub}
          icon={Star}
        />
      </div>

      {/* Calendar + listing health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => scrollToId("host-calendar-sync")}
          className="rounded-2xl border border-nexa-line bg-white p-5 text-left hover:border-nexa-primary/40 transition-colors"
        >
          <p className="text-sm text-nexa-ink-3 mb-2">
            {t("hostDashboard.calendarStatus")}
          </p>
          <p className="text-xl font-bold text-nexa-ink">
            {cal.healthy
              ? t("hostDashboard.calendarHealthy")
              : t("hostDashboard.calendarNeedsAttention").replace(
                  "{count}",
                  String(cal.listings_needing_attention),
                )}
          </p>
        </button>

        <button
          type="button"
          onClick={() => scrollToId("host-listings")}
          className="rounded-2xl border border-nexa-line bg-white p-5 text-left hover:border-nexa-primary/40 transition-colors"
        >
          <p className="text-sm text-nexa-ink-3 mb-3">
            {t("hostDashboard.listingHealth")}
          </p>
          <ul className="space-y-1.5 text-sm mb-3">
            <li className="flex items-center gap-2 text-nexa-ink">
              <ShieldCheck
                className={cn(
                  "h-4 w-4",
                  health?.verified_live ? "text-green-600" : "text-nexa-ink-4",
                )}
              />
              {t("hostDashboard.healthVerified")}
            </li>
            <li className="flex items-center gap-2 text-nexa-ink">
              <Link2
                className={cn(
                  "h-4 w-4",
                  health?.calendar_synced ? "text-green-600" : "text-nexa-ink-4",
                )}
              />
              {t("hostDashboard.healthCalendarSynced")}
            </li>
            <li className="flex items-center gap-2 text-nexa-ink">
              <Camera
                className={cn(
                  "h-4 w-4",
                  health?.photos_complete ? "text-green-600" : "text-nexa-ink-4",
                )}
              />
              {t("hostDashboard.healthPhotosComplete")}
            </li>
          </ul>
          <p className="text-xs font-semibold text-nexa-ink-3 mb-2">
            {t("hostDashboard.healthCompletePct").replace(
              "{pct}",
              String(health?.avg_completion_pct ?? 0),
            )}
          </p>
          {(health?.missing?.length ?? 0) > 0 ? (
            <ul className="space-y-1">
              {health!.missing.slice(0, 3).map((m) => (
                <li
                  key={m.code}
                  className="flex items-center gap-1.5 text-xs text-amber-700"
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {m.label}
                </li>
              ))}
            </ul>
          ) : null}
        </button>
      </div>

      {series.length > 0 ? (
        <RevenueSparkline series={series} currency={stats.currency} t={t} />
      ) : null}
    </section>
  );
}
